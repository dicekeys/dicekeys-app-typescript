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
  readonly host: string,
  readonly request: ApiCalls.RequestMessage,
}

export abstract class QueuedApiRequest implements ApiRequestContext {
  constructor(
    public readonly host: string,
    public readonly originalRequest: ApiCalls.RequestMessage,
  ) {}

  mutatedRequest?: ApiCalls.RequestMessage;

  get request(): ApiCalls.RequestMessage { return this.mutatedRequest ?? this.originalRequest }

  abstract throwIfClientNotPermitted: () => void;
  abstract transmitResponse: (response: ApiCalls.Response) => Promise<void>;

  getResponse = async (seedString: string) => {
    const request = this.mutatedRequest ?? this.request;
    const response = (typeof global.Worker !== "undefined") ?
      // We're in an environment with web workers. Await a remote execute
      (await new ComputeApiCommandWorker().calculate({seedString, request})) :
      // We have no choice but to run synchronously in this process
      // (fortunately, that means we're non-interactive and just testing)
      new SeededApiRequest(await SeededCryptoModulePromise, seedString, request).execute();
    return response;
  }

  sendError = async (e: any) => {
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
    const { requestId } = this.request;
    await this.transmitResponse({
      requestId, exception, message, stack
    });
  }
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

    // Ensure the command isn't computationally prohibitive

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

