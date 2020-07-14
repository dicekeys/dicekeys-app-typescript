import "core-js/stable";
import "regenerator-runtime/runtime";

// Hack to allow the webassembly module to load since it looks for window
// FUTURE - can this be removed with better use of emscripten to generate non-broken code?
// is this an artifact of the use of parcel when Stuart was testing this? 
(global as any).Window = (self as any).Window || self;

import {
  SeededApiRequest
} from "../api-handler/seeded-api-request";
import {
  ApiCalls, ApiStrings
} from "@dicekeys/dicekeys-api-js";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";

/**
 * A request to process an image frame while scanning dicekeys
 */
export interface ApiRequestWithSeed<REQUEST extends ApiCalls.ApiRequestObject> {
    seedString: string,
    request: REQUEST
}

export type ExecuteApiResponse<REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject> = ApiCalls.ResponseForRequest<REQUEST>;

function isApiRequestWithSeed(t: any) : t is ApiRequestWithSeed<ApiCalls.ApiRequestObject> {
    return typeof t === "object" &&
      typeof t["seedString"] === "string" &&
      typeof t["request"] === "object" &&
      ApiStrings.isCommand(t["request"]["command"])
}

addEventListener( "message", async (requestMessage) => {
  if (isApiRequestWithSeed(requestMessage.data)) {
    const {seedString, request} = requestMessage.data;
    const response = new SeededApiRequest(
      await SeededCryptoModulePromise,
      seedString,
      request
    ).execute();
    (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage(response);
  }
});
