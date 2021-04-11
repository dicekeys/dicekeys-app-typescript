import {
  ApiCalls
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfHostNotPermitted
} from "./post-message-permission-checks";
import {
  handleApiRequest,
  ApiRequestContext,
  ConsentResponse,
  QueuedApiRequest
} from "./handle-api-request";
import { PostMessageRequestMetadata } from "@dicekeys/dicekeys-api-js/dist/post-message-api-factory";

export class QueuedPostMessageApiRequest extends QueuedApiRequest {

  throwIfClientNotPermitted: () => void = () => throwIfHostNotPermitted(this.host)(this.request);

  transmitResponse = (response: ApiCalls.Response) => window.opener.postMessage(response, origin)

  private constructor(
    host: string,
    originalRequest: ApiCalls.RequestMessage,
    transmitResponseForTesting?: (response: ApiCalls.Response) => any // only set when testing
  ) {
    super(host, originalRequest);
    if (transmitResponseForTesting) {
      this.transmitResponse = transmitResponseForTesting;
    }
  }

  static create = (
    candidateRequestEvent: MessageEvent,
    transmitResponseForTesting?: (response: ApiCalls.Response) => any // only set when testing
  ): QueuedPostMessageApiRequest | undefined => {
    if (!(
      // Exit if the data field doesn't have a "command" field with a known command.
      candidateRequestEvent.data &&
      typeof candidateRequestEvent.data === "object" &&
      "command" in candidateRequestEvent.data &&
      candidateRequestEvent.data.command in ApiCalls.Command)
    ) {
      // This is not a request.  Ignore this message event.
      return;
    }
    const origin = candidateRequestEvent.origin;
    const {windowName, ...request} = candidateRequestEvent.data as ApiCalls.RequestMessage & PostMessageRequestMetadata;
  // The host must match any requirements in the recipe and
  // (for unseal operations) the UnsealingInstructions.      
    const host = origin.startsWith("https://") ? origin.substr(8) :
    origin.startsWith("http://localhost") ? "localhost" : // useful for test
      // FUTURE -- add a general SecurityException
      (() => { throw Error("DiceKeys requests must come from HTTPS origins only") } )();
    return new QueuedPostMessageApiRequest(host, request, transmitResponseForTesting);
  }

}

/**
 * 
 */
export const postMessageApiResponder = (
  getUsersConsent: (requestContext: ApiRequestContext) => Promise<ConsentResponse>,
  transmitResponseForTesting?: (response: ApiCalls.Response) => any // only set when testing
) => (candidateRequestEvent: MessageEvent) => {
  if (!(
    // Exit if the data field doesn't have a "command" field with a known command.
    candidateRequestEvent.data &&
    typeof candidateRequestEvent.data === "object" &&
    "command" in candidateRequestEvent.data &&
    candidateRequestEvent.data.command in ApiCalls.Command)
  ) {
    // This is not a request.  Ignore this message event.
    return;
  }
  const origin = candidateRequestEvent.origin;
  const {windowName, ...request} = candidateRequestEvent.data as ApiCalls.RequestMessage & PostMessageRequestMetadata;
  const transmitResponse = transmitResponseForTesting ||
    (
      (response) => window.opener.postMessage(response, origin)
    );
  // The host must match any requirements in the recipe and
  // (for unseal operations) the UnsealingInstructions.      
  const host = origin.startsWith("https://") ? origin.substr(8) :
    origin.startsWith("http://localhost") ? "localhost" : // useful for test
      // FUTURE -- add a general SecurityException
      (() => { throw Error("DiceKeys requests must come from HTTPS origins only") } )();
  const throwIfClientNotPermitted = throwIfHostNotPermitted(host);
  const requestContext: ApiRequestContext = {
    host, request
  }
  return handleApiRequest(
    throwIfClientNotPermitted,
    getUsersConsent,
    transmitResponse,
    requestContext
  )
}
