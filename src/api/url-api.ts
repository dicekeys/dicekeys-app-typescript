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

export class UrlApi extends Api {
  private pendingCallResolveFunctions = new Map<string, {resolve: (url: URL) => any, reject: (err: any) => any}>();

  constructor(
    private requestUrlBase: string,
    private respondToUrl: string,
    private transmitRequest: (request: URL) => any
  ) {
    super();
  }

  protected call = async <T>(
    command: Command,
    authTokenRequired: boolean,
    parameters: [string, string | Uint8Array | {toJson: () => string} ][],
    processResponse: (unmarshallerForResponse: UnmsarshallerForResponse) => T | Promise<T>
  ): Promise<T> => {
    const requestId = this.generateRequestId();
    const requestUrl = new URL(this.requestUrlBase);
    requestUrl.searchParams.set(Inputs.COMMON.requestId, requestId);
    requestUrl.searchParams.set(Inputs.COMMON.respondTo, this.respondToUrl);
    requestUrl.searchParams.set(Inputs.COMMON.command, command);
    if (authTokenRequired) {
      const authToken = await this.getAuthToken();
      requestUrl.searchParams.set(Inputs.COMMON.authToken, authToken);
    }
    parameters.forEach( ([name, value]) =>
      value != null &&
      requestUrl.searchParams.set(
        name,
        (typeof value === "string") ?
          value :
          "toJson" in value ?
            value.toJson() :
            urlSafeBase64Encode(value)
    ));
    const urlPromise = new Promise<URL>( (resolve, reject) => this.pendingCallResolveFunctions.set(requestId, {resolve, reject}));
    this.transmitRequest(requestUrl);

    const url = await urlPromise;
    const getOptionalStringParameter = (name: string): string | undefined =>
      url.searchParams.get(name) ?? undefined;
    const getStringParameter = (name: string): string =>
      url.searchParams.get(name) ??
        (() => { throw new Error(`Missing parameter ${name}`); } )();
    const getBinaryParameter = (name: string): Uint8Array =>
      urlSafeBase64Decode(getStringParameter(name));
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
  handleResult = (result: URL) => {
    const requestId = result.searchParams.get(Outputs.COMMON.requestId);
    if (requestId && this.pendingCallResolveFunctions.has(requestId)) {
      const resolveFn = this.pendingCallResolveFunctions.get(requestId);
      this.pendingCallResolveFunctions.delete(requestId);
      try {
        const exception = result.searchParams.get(Outputs.COMMON.exception);
        if (exception) {
          const exceptionMessage = result.searchParams.get(Outputs.COMMON.exceptionMessage);
          throw new Error(`Exception: ${exception} with message ${exceptionMessage}`);
        }
        resolveFn!.resolve(result);
      } catch (e) {
        resolveFn!.reject(e);
      }
    }
  }

}
