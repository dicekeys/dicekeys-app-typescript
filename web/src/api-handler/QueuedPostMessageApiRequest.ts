import {
  QueuedApiRequest
} from "./QueuedApiRequest";
import { PostMessageRequestMetadata } from "@dicekeys/dicekeys-api-js/dist/post-message-api-factory";
import {
  Recipe,
  ApiCalls,
  Exceptions,
  UnsealingInstructions,
  WebBasedApplicationIdentity
} from "@dicekeys/dicekeys-api-js";
import { Command } from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {
  extraRequestRecipeAndInstructions
} from "./get-requests-recipe";
import { FaceLetterAndDigit } from "../dicekeys/DiceKey";


export const doesHostMatchRequirement = (
  {hostExpected, hostObserved}: {hostExpected: string, hostObserved: string}
) =>
  // (A)
  // There is no "*." prefix in the hostExpected specification so an exact
  // match is required
  hostObserved === hostExpected ||
  // (B)
  // The hostExpected specification has a wildcard subdomain prefix ".*"
  (
    hostExpected.startsWith("*.") && // and
    (
      // The host is not a subdomain, but the parent domain
      // (e.g. "example.com" satisfies "*.example.com" with
      //  hostExpected is "*.example.com" and hostObserved is "example.com")
      hostObserved === hostExpected.substr(2) ||
      // Or the host is a valid subdomain, with a prefix that ends in a "."
      // (e.g. "sub.example.com" ends in (".example.com" with
      //  hostExpected of "*.example.com" and hostObserved of "example.com")
      hostObserved.endsWith(hostExpected.substr(1))
    )
  );

export const isHostOnAllowList = (
  host: string,
  webBasedApplicationIdentities: WebBasedApplicationIdentity[]
): boolean => webBasedApplicationIdentities.some( 
  webBasedApplicationIdentity =>
    doesHostMatchRequirement({
      hostExpected: webBasedApplicationIdentity.host,
      hostObserved: host
    })
);

export const throwIfHostNotOnAllowList =
  (host: string) =>
    (allowList: WebBasedApplicationIdentity[]): void => {
      if (!isHostOnAllowList(host, allowList)) {
        throw new Exceptions.ClientNotAuthorizedException(
          `Client '${host}' is not on this list of allowed hosts: ${JSON.stringify(allowList)}`
        );
      }
    }

/**
 * Check to see if a host is permitted to perform a requested operation.
 *
 * @param host The host portion of the origin (all origins are https://, so that's excluded)
 * @param request The requested operation
 * 
 * @throws ClientNotAuthorizedException
 */
export const throwIfHostNotPermitted = (host: string) => {
  const throwIfNotOnAllowList = throwIfHostNotOnAllowList(host);
  return (request: ApiCalls.ApiRequestObject): void => {
    const {recipe, unsealingInstructions} = extraRequestRecipeAndInstructions(request);

    if (request.command === Command.getSealingKey && !request.recipe) {
      // There's no recipe to check since the request is for a global sealing key
      // that can be used with unsealingInstructions to restrict who can decrypt it.
      return
    }
    
    const allowFieldFromRecipe = Recipe(recipe).allow;
    const allowFromUnsealingInstructions = UnsealingInstructions(unsealingInstructions).allow;

    // Unsealing operations have two possible allow lists, both embedded in the packageSealedMessage parameter:
    //   - like all other operations, an allow list may be placed in recipe.
    //   = unique to these operations, an allow list may be placed in the unsealing instructions.
    if (!allowFieldFromRecipe && !(request.command === Command.unsealWithUnsealingKey && allowFromUnsealingInstructions)) {
      throw new Exceptions.ClientNotAuthorizedException(
        `The recipe must have an allow clause.`
      );
    }
    if (allowFieldFromRecipe) {
      throwIfNotOnAllowList(allowFieldFromRecipe)
    } 
    if (request.command === Command.unsealWithUnsealingKey && allowFromUnsealingInstructions) {
      throwIfNotOnAllowList(allowFromUnsealingInstructions)
    }
  }
}


export type PostMessageRequestEvent = MessageEvent & {data: ApiCalls.RequestMessage & PostMessageRequestMetadata}

export class QueuedPostMessageApiRequest extends QueuedApiRequest {
  readonly host: string;
  readonly originalRequest: ApiCalls.RequestMessage;
  readonly origin: string;

  throwIfClientNotPermitted: () => void = () => throwIfHostNotPermitted(this.host)(this.request);

  transmitResponse = (response: ApiCalls.Response, {centerLetterAndDigit, sequenceNumber}: {centerLetterAndDigit?: FaceLetterAndDigit, sequenceNumber?: number}) =>  { (this.requestEvent.source?.postMessage as (m: unknown, t?: Transferable[]) => unknown)({
    ...response,
    ...(centerLetterAndDigit == null ? {} : {centerLetterAndDigit}),
    ...(sequenceNumber == null ? {} : {"#": sequenceNumber}),
  }) }

  static messageEventIsApiRequest = (
    candidateRequestEvent: MessageEvent
  ): candidateRequestEvent is PostMessageRequestEvent => (
    candidateRequestEvent.data &&
    typeof candidateRequestEvent.data === "object" &&
    "command" in candidateRequestEvent.data &&
    candidateRequestEvent.data.command in ApiCalls.Command
  );

  constructor(
    private requestEvent: PostMessageRequestEvent
  ) {
    super();
    const origin = requestEvent.origin;
    this.origin = origin;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
