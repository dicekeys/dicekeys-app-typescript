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

export interface RequestTransmitter {
  (request: {[name: string]: string | Uint8Array}): any
};

export class PostMessageApi extends Api {
  /**
   * An window opened in the DiceKeys app to which we can send
   * API requests.
   */
  private diceKeysAppWindow: Window | undefined;

  private pendingCallResolveFunctions = new Map<string, 
    {
      resolve: (response: MessageEvent & {data: {[name: string]: string | Uint8Array}}) => any,
      reject: (err: any) => any
  }>();

  /**
   * Transmit reqeusts to a window running the DiceKeys app, creating that
   * window if necessary.
   */
  private defaultTransmitRequest: RequestTransmitter = (request) => {
    if (!this.diceKeysAppWindow || this.diceKeysAppWindow.closed) {
      // Need to create a new window to send API requests to
      this.diceKeysAppWindow = window.open("https://dicekeys.app") ?? undefined;
    }
    this.diceKeysAppWindow?.postMessage(request, "https://dicekeys.app");
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
    const requestId = this.generateRequestId();
    const requestObject = {} as {[name: string]: string | Uint8Array};
    requestObject[Inputs.COMMON.requestId] = requestId;
    requestObject[Inputs.COMMON.command] = command;
    parameters.forEach( ([name, value]) => {
      if (value == null) return;
      requestObject[ name] =
        (typeof value === "object" && "toJson" in value) ?
            value.toJson() :
            value
    });
    const responseMessagePromise =
      new Promise<MessageEvent & {data: {[name: string]: string | Uint8Array}}>(
        (resolve, reject) =>
          this.pendingCallResolveFunctions.set(requestId, {resolve, reject})
      );
    this.transmitRequest(requestObject);

    const result = await responseMessagePromise;
    const getOptionalStringParameter = (name: string): string | undefined => {
      const val = result.data[name]
      return typeof val === "string" ? val : undefined;
    }
    const getStringParameter = (name: string): string =>
      getOptionalStringParameter(name) ??
        (() => { throw new Error(`Missing parameter ${name}`); } )();
    const getBinaryParameter = (name: string): Uint8Array => {
      const val = result.data[name]
      return typeof val === "string" ? urlSafeBase64Decode(val) :
        typeof val === "object" && val instanceof Uint8Array ? val :
        (() => { throw new Error(`Missing parameter ${name}`); } )();        
    }
    return await processResponse({
      getOptionalStringParameter, getStringParameter, getBinaryParameter
    });
  }

  
  /**
   * Activities and Fragments that use this API should implement onActivityResult and
   * and call handleOnActivityResult with the data/intent (third parameter) received.
   * Doing so allows this class to process results returned to the activity/fragment
   * and then call the appropriate callback functions when an API call has either
   * succeeded or failed.
   */
  handlePossibleResultMessage = (result: MessageEvent & {data: {[name: string]: string | Uint8Array}}) => {
    const response = result.data;
    const requestId = response[Outputs.COMMON.requestId];
    // FIXME -- validate origin is the Dicekeys app for good measure,
    // or treat the RequestId as an authentication key since it's strong enough?
    // Will do latter for now.
    if (requestId && this.pendingCallResolveFunctions.has(requestId)) {
      const resolveFn = this.pendingCallResolveFunctions.get(requestId)!;
      this.pendingCallResolveFunctions.delete(requestId);
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
