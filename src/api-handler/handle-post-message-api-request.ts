import {
  ApiCalls
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfHostNotPermitted
} from "./post-message-permission-checks";
import {
  QueuedApiRequest
} from "./handle-api-request";
import { PostMessageRequestMetadata } from "@dicekeys/dicekeys-api-js/dist/post-message-api-factory";

type PostMessageRequestEvent = MessageEvent & {data: ApiCalls.RequestMessage & PostMessageRequestMetadata}

export class QueuedPostMessageApiRequest extends QueuedApiRequest {
  readonly host: string;
  readonly originalRequest: ApiCalls.RequestMessage;
  readonly origin: string;

  throwIfClientNotPermitted: () => void = () => throwIfHostNotPermitted(this.host)(this.request);

  transmitResponse = (response: ApiCalls.Response) => window.opener.postMessage(response, this.origin)

  static messageEventIsApiRequest = (
    candidateRequestEvent: MessageEvent
  ): candidateRequestEvent is PostMessageRequestEvent => (
    candidateRequestEvent.data &&
    typeof candidateRequestEvent.data === "object" &&
    "command" in candidateRequestEvent.data &&
    candidateRequestEvent.data.command in ApiCalls.Command
  );

  constructor(
    requestEvent: PostMessageRequestEvent
  ) {
    super();
    const origin = requestEvent.origin;
    this.origin = origin;
    const {windowName, ...request} = requestEvent.data as ApiCalls.RequestMessage & PostMessageRequestMetadata;
  // The host must match any requirements in the recipe and
  // (for unseal operations) the UnsealingInstructions.      
    const host = this.origin.startsWith("https://") ? origin.substr(8) :
    origin.startsWith("http://localhost") ? "localhost" : // useful for test
      // FUTURE -- add a general SecurityException
      (() => { throw Error("DiceKeys requests must come from HTTPS origins only") } )();
    this.host  = host;
    this.originalRequest = request;
  }

}
