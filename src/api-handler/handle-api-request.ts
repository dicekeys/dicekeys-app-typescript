import {
  ApiCalls,
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfClientMayNotRetrieveKey
} from "./permission-checks"
import {
  ComputeApiCommandWorker
} from "../workers/call-api-command-worker"
import { SeededApiRequest } from "./seeded-api-request";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";

export interface ApiRequestContext {
  host: string,
  request: ApiCalls.RequestMessage,
}

export interface ConsentResponse<REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject> {
  seedString: string,
  mutatedRequest: REQUEST,
  precalculatedResult?: Promise<ApiCalls.ResponseForRequest<REQUEST>>
}

export const handleApiRequest = async (
  throwIfClientNotPermitted: (request: ApiCalls.ApiRequestObject) => void,
  getUsersConsent: (request: ApiRequestContext) => Promise<ConsentResponse>,
  transmitResponse: (response: ApiCalls.Response) => any,
  requestContext: ApiRequestContext
) => {
  const {requestId, ...request} = requestContext.request;

  try {
    // Ensure that the command is legal
    throwIfClientNotPermitted(request);
    throwIfClientMayNotRetrieveKey(request);

    // Ensure the command isn't computationally prohobitive

    // FIXME

    // Get the user's consent and allow the user to modify the request as necessary
    const {seedString, mutatedRequest} = await getUsersConsent(requestContext);
  
    const response = (typeof global.Worker !== "undefined") ?
      // We're in an environment with web workers. Await a remote execute
      (await new ComputeApiCommandWorker().calculate({seedString, request: mutatedRequest})) :
      // We have no choice but to run synchronously in this process
      // (fortunately, that means we're non-interactive and just testing)
      new SeededApiRequest(await SeededCryptoModulePromise, seedString, request).execute();

    await transmitResponse({
      requestId,
      ...response
    });

  } catch (e) { 
    const exception: string = 
      (typeof e === "string") ?
        e :
    (typeof e === "object" && "name" in e && typeof e.name === "string") ?
        e.name :
      "unknown";
    const message: string | undefined = 
      (typeof e === "object" && "message" in e && typeof e.message === "string") ?
        e.message : "unknown";
    const stack: string | undefined = 
    (typeof e === "object" && "stack" in e && typeof e.stack === "string") ?
      e.stack : undefined;
    await transmitResponse({
      requestId, exception, message, stack
    });
  }

  setInterval( () => window.close(), 250);
}

