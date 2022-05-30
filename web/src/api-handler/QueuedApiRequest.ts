import {
  ApiCalls, Recipe, Exceptions
} from "@dicekeys/dicekeys-api-js";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { SeededApiCommands } from "./SeededApiCommands";
import { ApiRequestObject } from "@dicekeys/dicekeys-api-js/dist/api-calls";
import { CenterLetterAndDigit } from "../dicekeys/DiceKey";

export interface ApiRequestContext {
  readonly host: string,
  readonly request: ApiCalls.RequestMessage,
}

export abstract class QueuedApiRequest implements ApiRequestContext {
  abstract readonly host: string;
  abstract readonly originalRequest: ApiCalls.RequestMessage;

  // constructor({host, request}: ApiRequestContext) {
  //   this.host = host;
  //   this.originalRequest = request;
  // }

  mutatedRequest?: ApiCalls.RequestMessage;

  get request(): ApiCalls.RequestMessage { return this.mutatedRequest ?? this.originalRequest }

  /**
   * Subclasses must implement this permission check to validate that the client is
   * permitted to make the request.
   */
  abstract throwIfClientNotPermitted: () => void;

  /**
   * Subclasses must implement this method to transmit the response back to the client.
   */
  abstract transmitResponse: (response: ApiCalls.Response, centerLetterAndDigit?: CenterLetterAndDigit, sequenceNumber?: number) => Promise<void> | void;

  /**
   * Security check implemented as static so that it can be exposed to unit tests
   * @param request 
   */
  static throwIfClientMayNotRetrieveKey = (request: ApiCalls.RequestMessage) => {
    if (
      ApiCalls.requestRequiresRecipeToSetClientMayRetrieveKey(request) &&
      !Recipe(request.recipe).clientMayRetrieveKey
    ) {
      throw new Exceptions.ClientMayRetrieveKeyNotSetInRecipe()
    }
  }

  /**
   * Throw if this command requires a recipe with "clientMayRetrieveKey": true
   * but clientMayRetrieveKey is not set to true.
   */
  protected throwIfClientMayNotRetrieveKey = () => {
    QueuedApiRequest.throwIfClientMayNotRetrieveKey(this.request);
  }

  /**
   * Throw if this request violates security, either because the client is not
   * permitted to make it or because the command requires clientMayRetrieveKey: true
   * but it was not set to true.
   */
  protected throwIfNotPermitted = () => {
    this.throwIfClientMayNotRetrieveKey();
    this.throwIfClientNotPermitted();
  }
  
  /**
   * Get the correct response for a request, spawning a working to do the computation
   * and then caching the result so that it need only be computed once..
   * @param seedString The cryptographic seed for the operation
   * @returns A promise for the requests corresponding response object
   * @throws Exceptions when a request is not permitted.
   */
  async getResponse(seedString: string): Promise<ApiCalls.Response> {
    this.throwIfNotPermitted();
    const request = this.mutatedRequest ?? this.request;
    const {requestId} = this.request;
    if (typeof Worker === "undefined") {
      // We have no choice but to run synchronously in this process
      // (fortunately, that means we're non-interactive and just testing)
      const response = new SeededApiCommands(await SeededCryptoModulePromise, seedString).executeRequest<ApiRequestObject>(request);
      const responseWIthRequestId = {...response, requestId};
      // console.log(`getResponse.requestId`, requestId)
      // console.log(`getResponse.responseWIthRequestId`, responseWIthRequestId)
      return responseWIthRequestId;
    } else {
      // We're in an environment with web workers. Await a remote execute
      const ComputeApiCommandWorkerModule = await import ("../workers/call-api-command-worker");
      const result = await new ComputeApiCommandWorkerModule.ComputeApiCommandWorker().calculate({seedString, request});
      console.log(`calculated ${seedString}`, request, result)
      return {...result, requestId};
    }
  }

  /**
   * Translates an error of unspecified type into an [exception, message, stack]
   * triple and sends it as a response.
   * @param e An error of unspecified type
   */
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

  /**
   * Send user declined
   */
  sendUserDeclined = () => {
    this.sendError( new Exceptions.UserDeclinedToAuthorizeOperation() );
  }

  /**
   * Responds to the request, sending a success response if the request is legal
   * (authorization checks pass) and successful, or sending an error triple
   * otherwise.
   * @param seedString The seed to use for the cryptographic operations requested.
   */
  respond = async (seedString: string, centerLetterAndDigit?: CenterLetterAndDigit, sequenceNumber?: number) => {
    try {
      const response = await this.getResponse(seedString);
      console.log(`response.response=`, response);
      this.transmitResponse(response, centerLetterAndDigit, sequenceNumber);
    } catch(e) {
      this.sendError(e);
    }
  }
}

export interface ConsentResponse<REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject> {
  seedString: string,
  mutatedRequest: REQUEST,
  precalculatedResult?: Promise<ApiCalls.ResponseForRequest<REQUEST>>
}
