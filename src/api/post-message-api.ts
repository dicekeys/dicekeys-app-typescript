import {
  Api,
  UnmsarshallerForResponse
} from "./abstract-api"
import {
  Inputs,
  Outputs,
  Command,
} from "./api-strings";
import {
  urlSafeBase64Decode,
  urlSafeBase64Encode
} from "./encodings";
import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";

/**
 * Typing for the transmit function, so that our unit testing framework
 * can substitute a custom transmitter to simulate postMessage reqeusts.
 */
export interface RequestTransmitter {
  (request: {[name: string]: string | Uint8Array}): any
};

/**
 * Create response-marshalling functions for post-message responses
 * @param dataObject the message.Data field of the DiceKeys app's response
 * to a request.
 */
const createPostMessageUnmarshallingFunctions = (
  dataObject: {[name: string]: string | Uint8Array}
) => {
  const getOptionalStringParameter = (name: string): string | undefined => {
    const val = dataObject[name]
    return typeof val === "string" ? val : undefined;
  }
  const getStringParameter = (name: string): string =>
    getOptionalStringParameter(name) ??
      (() => { throw new Error(`Missing parameter ${name}`); } )();
  const getBinaryParameter = (name: string): Uint8Array => {
    const val = dataObject[name]
    return typeof val === "string" ? urlSafeBase64Decode(val) :
      typeof val === "object" && val instanceof Uint8Array ? val :
      (() => { throw new Error(`Missing parameter ${name}`); } )();        
  }
  return {
    getOptionalStringParameter, getStringParameter, getBinaryParameter
  };
}

/**
 * Implement the DiceKeys API using post-messages, opening the app in
 * another window to handle requests.
 */
export class PostMessageApi extends Api {
  /**
   * An window opened in the DiceKeys app to which we can send
   * API requests.
   */
  private static diceKeysAppWindow: Window | undefined;

  /**
   * Map requestIds to the resolve/reject functions needed to re-start
   * resume the [[call]] function when the DiceKeys app sends the response
   * to a request.
   */
  private static pendingCallResolveFunctions = new Map<string, 
    {
      resolve: (response: MessageEvent & {data: {[name: string]: string | Uint8Array}}) => any,
      reject: (err: any) => any
  }>();

  /**
   * Transmit reqeusts to a window running the DiceKeys app, creating that
   * window if necessary.
   */
  private defaultTransmitRequest: RequestTransmitter = (request) => {
    if (!PostMessageApi.diceKeysAppWindow || PostMessageApi.diceKeysAppWindow.closed) {
      // Need to create a new window to send API requests to
      PostMessageApi.diceKeysAppWindow = window.open("https://dicekeys.app") ?? undefined;
    }
    PostMessageApi.diceKeysAppWindow?.postMessage(request, "https://dicekeys.app");
  }

  private readonly transmitRequest: RequestTransmitter;
  constructor(
    transmitRequest?: RequestTransmitter
  ) {
    super();
    // Ensure that results sent back via postMessage are received
    // and sent to handleResult;
    if (transmitRequest) {
      // This is being use for tests where the request transmitter is overriden
      this.transmitRequest = transmitRequest;
    } else {
      // This is being used in a real window, where requests are transmitted to
      // a child window and resposnes come back via window.postMessage, generating
      // message events on this window.
      this.transmitRequest = this.defaultTransmitRequest;
      window.addEventListener("message", (message) => this.handlePossibleResultMessage(message));
    }
  }

  protected call = async <T>(
    command: Command,
    authTokenRequired: boolean,
    parameters: [string, string | Uint8Array | {toJson: () => string} ][],
    processResponse: (unmarshallerForResponse: UnmsarshallerForResponse) => T | Promise<T>
  ) : Promise<T> => {
    // Generate a random request ID, which will be returned with the response,
    // so that we will know that response is for this request.
    const requestId = this.generateRequestId();
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
    // We'll use a promise to wait for the response, storing a resolve and
    // reject function so that the [[handlePossibleResultMessage]] function can
    // find them by the requestId.
    const responseMessagePromise =
      new Promise<MessageEvent & {data: {[name: string]: string | Uint8Array}}>(
        (resolve, reject) =>
          PostMessageApi.pendingCallResolveFunctions.set(requestId, {resolve, reject})
      );
    // We'll now transmit the request.  We use a transmitRequest function which
    // is set by the constructor to facilitate testing.  In production, all
    // that does is call the [[defaultTransmitRequest]], which creates a window
    // for the DiceKey app if necessary and sends a postMessage to the app.
    this.transmitRequest(requestObject);

    // We now await the response, which will arrive via a message event,
    // be processed by [[handlePossibleResultMessage]], which will
    // cause the promise to be resolved or rejected.
    const result = await responseMessagePromise;

    // Create the unmsarshalling functions needed so that our data-format-agnostic
    // processResponse function can access the response fields.
    const unmarshallingFunctions = createPostMessageUnmarshallingFunctions(result.data);

    // Let the inherited processResponse function turn the response into
    // whatever response type the caller was expecting.
    return await processResponse(unmarshallingFunctions);
  }

  handlePossibleResultMessage = (result: MessageEvent) => {
    const response = result.data as {[name: string]: string | Uint8Array};
    const requestId = response[Outputs.COMMON.requestId] as string;
    // FIXME -- validate origin is the Dicekeys app for good measure,
    // or treat the RequestId as an authentication key since it's strong enough?
    // Will do latter for now.
    if (requestId && PostMessageApi.pendingCallResolveFunctions.has(requestId)) {
      const resolveFn = PostMessageApi.pendingCallResolveFunctions.get(requestId)!;
      PostMessageApi.pendingCallResolveFunctions.delete(requestId);
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

}
