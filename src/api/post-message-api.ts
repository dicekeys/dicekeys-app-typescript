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
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";

export class PostMessageApi extends Api {
  private pendingCallResolveFunctions = new Map<string, 
    {resolve: (response: MessageEvent & {data: {[name: string]: string | Uint8Array}}) => any,
    reject: (err: any) => any
  }>();

  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    private requestUrlBase: string,
    private respondToUrl: string,
    private transmitRequest: (request: {[name: string]: string | Uint8Array}) => any
  ) {
    super(seededCryptoModule);
  }

  protected call = async <T>(
    command: Command,
    authTokenRequired: boolean,
    parameters: [string, string | Uint8Array | {toJson: () => string} ][],
    processResponse: (unmarshallerForResponse: UnmsarshallerForResponse) => T
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
    return processResponse({
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
  handleResult = (result: MessageEvent & {data: {[name: string]: string | Uint8Array}}) => {
    const response = result.data;
    const requestId = response[Outputs.COMMON.requestId];
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
