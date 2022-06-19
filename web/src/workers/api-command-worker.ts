import {
  ApiCalls,
} from "@dicekeys/dicekeys-api-js";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { SeededApiCommands } from "../api-handler/SeededApiCommands";
import { ApiRequestObject } from "@dicekeys/dicekeys-api-js/dist/api-calls";

/**
 * A request to process an image frame while scanning dicekeys
 */
export interface ApiRequestWithSeed<REQUEST extends ApiCalls.ApiRequestObject> {
    seedString: string,
    request: REQUEST & ApiCalls.ApiRequestObject
}
export type ExecuteApiResponse<REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject> = ApiCalls.ResponseForRequest<REQUEST>;

function isApiRequestWithSeed(t: unknown) : t is ApiRequestWithSeed<ApiCalls.ApiRequestObject> {
    return typeof t === "object" && t != null &&
      typeof ((t as {seedString?: unknown})["seedString"]) === "string" &&
      typeof ((t as {request?: unknown})["request"]) === "object" &&
      ((t as {request: {command?: string}}).request?.command ?? "") in ApiCalls.Command
}

addEventListener( "message", async (requestMessage) => {
  if (isApiRequestWithSeed(requestMessage.data)) {
    const {seedString, request} = requestMessage.data;
    try {
      const response = new SeededApiCommands(await SeededCryptoModulePromise, seedString).executeRequest<ApiRequestObject>(request);
      (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage(response);
    } catch (exception) {
      console.log("Worker exception", exception, typeof (exception));
      (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage(
        {exception: exception instanceof Error ?
          JSON.stringify({name: exception.name, message: exception.message, stack: exception.stack}) :
          JSON.stringify(exception, undefined, " "), request});
    }
  }
});
