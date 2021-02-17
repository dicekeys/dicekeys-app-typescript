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
          `Client '${host}' is not among list of allowed hosts: ${JSON.stringify(allowList)}`
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
      // There's no derivation options to check since the request is for a global sealing key
      // that can be used with unsealingInstructions to restrict who can decrypt it.
      return
    }
    
    const allowFromDerivationOptions = Recipe(recipe).allow;
    const allowFromUnsealingInstructions = UnsealingInstructions(unsealingInstructions).allow;

    // Unsealing operations have two possible allow lists, both embedded in the packageSealedMessage parameter:
    //   - like all other operations, an allow list may be placed in derivation options.
    //   = unique to these operations, an allow list may be placed in the unsealing instructions.
    if (!allowFromDerivationOptions && !(request.command === Command.unsealWithUnsealingKey && allowFromUnsealingInstructions)) {
      throw new Exceptions.ClientNotAuthorizedException(
        `The recipe must have an allow clause.`
      );
    }
    if (allowFromDerivationOptions) {
      throwIfNotOnAllowList(allowFromDerivationOptions)
    } 
    if (request.command === Command.unsealWithUnsealingKey && allowFromUnsealingInstructions) {
      throwIfNotOnAllowList(allowFromUnsealingInstructions)
    }
  }
}
