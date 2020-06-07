import {
  UnmsarshallerForResponse,
  generateRequestId,
} from "./api-factory"
import {
  Inputs,
  Outputs,
  Command,
} from "./api-strings";

export type ApiMessage = MessageEvent & {data: {[name: string]: string | Uint8Array}};

/**
 * Typing for the transmit function, so that our unit testing framework
 * can substitute a custom transmitter to simulate postMessage reqeusts.
 */
export interface TransmitRequestFunction {
  (request: {[name: string]: string | Uint8Array}): Promise<ApiMessage>
};

/**
 * Create response-marshalling functions for post-message responses
 * @param dataObject the message.Data field of the DiceKeys app's response
 * to a request.
 */
class UnmarshallerForPostMessageResponse implements UnmsarshallerForResponse {
  constructor(private dataObject: {[name: string]: string | Uint8Array}) {}
  
  getOptionalStringParameter = (name: string): string | undefined => {
    const val = this.dataObject[name]
    return typeof val === "string" ? val : undefined;
  }
  getStringParameter = (name: string): string =>
    this.getOptionalStringParameter(name) ??
      (() => { throw new Error(`Missing parameter ${name}`); } )();

  getBinaryParameter = (name: string): Uint8Array => {
    const val = this.dataObject[name]
    return typeof val === "object" && val instanceof Uint8Array ? val :
      (() => { throw new Error(`Missing parameter ${name}`); } )();        
  }

}


/**
 * An window opened in the DiceKeys app to which we can send
 * API requests.
 * 
 * Private and internal to this module to prevent rogue code form accessing it.
 */
var diceKeysAppWindow: Window | undefined;

/**
 * Map requestIds to the resolve/reject functions needed to re-start
 * resume the [[call]] function when the DiceKeys app sends the response
 * to a request.
 *
 * Private and internal to this module to prevent rogue code form accessing it.
 */
const pendingCallResolveFunctions = new Map<string, 
  {
    resolve: (response: MessageEvent & {data: {[name: string]: string | Uint8Array}}) => any,
    reject: (err: any) => any
}>();


/*
 * Handles calls to window.onMessage to receive resposnes to requests.
 */
export const handlePossibleResultMessage = (result: MessageEvent) => {
  const response = result.data as {[name: string]: string | Uint8Array};
  const requestId = response[Outputs.COMMON.requestId] as string;
  // FIXME -- validate origin is the Dicekeys app for good measure,
  // or treat the RequestId as an authentication key since it's strong enough?
  // Will do latter for now.
  if (requestId && pendingCallResolveFunctions.has(requestId)) {
    const resolveFn = pendingCallResolveFunctions.get(requestId)!;
    pendingCallResolveFunctions.delete(requestId);
    try {
      const exception = response[Outputs.COMMON.exception];
      if (exception) {
        const exceptionMessage = response[Outputs.COMMON.exceptionMessage];
        throw new Error(`Exception: ${exception} with message ${exceptionMessage}`);
      }
      resolveFn.resolve(result);
    } catch (e) {
      resolveFn.reject(e);
    }
  }
}
var liseningViaHandlePossibleResultMessage: boolean = false;


/**
 * Transmit reqeusts to a window running the DiceKeys app, creating that
 * window if necessary.
 */
const transmitRequest: TransmitRequestFunction = (request): Promise<ApiMessage> => {
  if (!liseningViaHandlePossibleResultMessage) {
    // Set up the listener for the reponse
    window.addEventListener("message", (messageEvent) =>
      handlePossibleResultMessage(messageEvent)
    );
    liseningViaHandlePossibleResultMessage = true;
  }
  if (!diceKeysAppWindow || diceKeysAppWindow.closed) {
    // Need to create a new window to send API requests to
    diceKeysAppWindow = window.open("https://dicekeys.app", "dicekeys-api-window") ?? undefined;
  }
  // We'll use a promise to wait for the response, storing a resolve and
  // reject function so that the [[handlePossibleResultMessage]] function can
  // find them by the requestId.
  const responseMessagePromise =
    new Promise<ApiMessage>(
      (resolve, reject) =>
        pendingCallResolveFunctions.set(request[Inputs.COMMON.requestId] as string, {resolve, reject})
    );
diceKeysAppWindow!.postMessage(request, "https://dicekeys.app");
  // We now await the response, which will arrive via a message event,
  // be processed by [[handlePossibleResultMessage]], which will
  // cause the promise to be resolved or rejected.
  return responseMessagePromise;
}


export const postMessageApiCallFactory = (
  transmitRequestFn: TransmitRequestFunction = transmitRequest,
) => async <T>(
  command: Command,
  parameters: [string, string | Uint8Array | {toJson: () => string} ][],
  processResponse: (unmarshallerForResponse: UnmsarshallerForResponse) => T | Promise<T>
) : Promise<T> => {
  // Generate a random request ID, which will be returned with the response,
  // so that we will know that response is for this request.
  const requestId = generateRequestId();
  // Build a request as an object matching parameter names to
  // parameters, which can either be strings or byte arrays.
  const requestObject = {} as {[name: string]: string | Uint8Array};
  // All requests contain a request ID and command name.
  requestObject[Inputs.COMMON.requestId] = requestId;
  requestObject[Inputs.COMMON.command] = command;
  // Copy all parameters into the object.  Parameters which are
  // objects that have a toJson() function should be turned into strings
  // by calling that toJson() function.
  parameters.forEach( ([name, value]) => {
    if (value == null) return;
    requestObject[ name] =
      (typeof value === "object" && "toJson" in value) ?
          value.toJson() :
          value
  });
  // We'll now transmit the request.  We use a transmitRequest function which
  // is set by the constructor to facilitate testing.  In production, all
  // that does is call the [[defaultTransmitRequest]], which creates a window
  // for the DiceKey app if necessary and sends a postMessage to the app.
  const result = await transmitRequestFn(requestObject);

  // Create the unmsarshalling functions needed so that our data-format-agnostic
  // processResponse function can access the response fields.
  const unmarshallingFunctions = new UnmarshallerForPostMessageResponse(result.data);

  // Let the inherited processResponse function turn the response into
  // whatever response type the caller was expecting.
  return await processResponse(unmarshallingFunctions);
}
