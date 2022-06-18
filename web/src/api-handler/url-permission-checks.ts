import {
  Recipe,
  Exceptions,
  UnsealingInstructions,
  WebBasedApplicationIdentity,
  AuthenticationRequirements, ApiCalls
} from "@dicekeys/dicekeys-api-js";
import { Command } from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {KnownCustomProtocolsToTheirAssociatedDomains} from "./KnownCustomProtocols";
import { extraRequestRecipeAndInstructions } from "./get-requests-recipe";
import {
  doesHostMatchRequirement
} from "./QueuedPostMessageApiRequest";

export const DefaultPermittedPathPrefix = `/--derived-secret-api--/`; 
const DefaultPermittedPathList = [`${ DefaultPermittedPathPrefix}*`];

const doesPathMatchRequirement = (
  {pathExpected, pathObserved}: {pathExpected: string, pathObserved: string}
) => {
  if (pathExpected.length > 0 && pathExpected[0] != "/") {
    // Paths must start with a "/".  If the path requirement didn't start with a "/",
    // we'll insert one assuming this was a mistake by the developer of the client software
    // that created the recipe string.
    pathExpected = "/" + pathExpected;
  }
  if (pathExpected.endsWith("/*")) {
    return pathObserved === pathExpected.substr(0, pathExpected.length - 2) ||
          pathObserved.startsWith(pathExpected.substr(0, pathExpected.length -1));
  } else if (pathExpected.endsWith("*")) {
    // The path requirement specifies a prefix, so test for a prefix match
    return pathObserved.startsWith(pathExpected.substr(0, pathExpected.length -1));
  } else {
    // This path requirement does not specify a prefix, so test for exact match
    return pathExpected === pathObserved;
  }
}

interface UrlCheckParameters {
  protocol: string;
  host: string;
  pathname: string;
}
export const isUrlOnAllowList = (
  {host, pathname, webBasedApplicationIdentities}:
    UrlCheckParameters & {webBasedApplicationIdentities: WebBasedApplicationIdentity[]}
): boolean => webBasedApplicationIdentities.some(
  webBasedApplicationIdentity =>
    doesHostMatchRequirement({
      hostExpected: webBasedApplicationIdentity.host,
      hostObserved: host
    }) &&
    (
      ( webBasedApplicationIdentity.paths ?? DefaultPermittedPathList ).some( pathExpected =>
        doesPathMatchRequirement({
          pathExpected, pathObserved: pathname
        })
      )
    )
);

interface AllowListCheckParameters extends UrlCheckParameters {
  hostValidatedViaAuthToken: boolean;
}
export const throwIfUrlNotOnAllowList =
  ({protocol,host, pathname, hostValidatedViaAuthToken}: AllowListCheckParameters) =>
    (requirements: AuthenticationRequirements): void => {
      const {allow = [], requireAuthenticationHandshake} = requirements;
      if (requireAuthenticationHandshake && !hostValidatedViaAuthToken) {
        throw new Exceptions.ClientNotAuthorizedException(`Host authentication required`);
      }
      if (!isUrlOnAllowList({protocol, host, pathname, webBasedApplicationIdentities: allow})) {
        throw new Exceptions.ClientNotAuthorizedException(
          `Client ${host} and ${pathname} is not on this list of allowed urls: ${JSON.stringify(allow)}`
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

export const throwIfUrlNotPermitted = (allowListCheckParameters:
    AllowListCheckParameters) => {
  const replacementHost = KnownCustomProtocolsToTheirAssociatedDomains[allowListCheckParameters.protocol];
  const throwIfNotOnAllowList = throwIfUrlNotOnAllowList(
    replacementHost == null ? 
      allowListCheckParameters :
      // If the URL was a known custom scheme (e.g., "bitwarden:"), replace it with
      // the host associated with that custom scheme.
      {...allowListCheckParameters, protocol: "https:", host: replacementHost}
    );
  return (request: ApiCalls.ApiRequestObject): void => {
    const {recipe, unsealingInstructions} = extraRequestRecipeAndInstructions(request);

    if (request.command === Command.getSealingKey && !request.recipe) {
      // There's no recipe to check since the request is for a global sealing key
      // that can be used with unsealingInstructions to restrict who can decrypt it.
      return
    }

    const recipeObject = Recipe(recipe);
    const parsedUnsealingInstructions = UnsealingInstructions(unsealingInstructions);

    // Unsealing operations have two possible allow lists, both embedded in the packageSealedMessage parameter:
    //   - like all other operations, an allow list may be placed in the recipe.
    //   = unique to these operations, an allow list may be placed in the unsealing instructions.
    if (!recipeObject && !(request.command === Command.unsealWithUnsealingKey && parsedUnsealingInstructions)) {
      throw new Exceptions.ClientNotAuthorizedException(
        `The recipe must have an allow clause.`
      );
    }

    if (recipeObject) {
      throwIfNotOnAllowList(recipeObject);
    }

    // Unsealing operations have two possible allow lists, both embedded in the packageSealedMessage parameter:
    //   - like all other operations, an allow list may be placed in the recipe.
    //   = unique to these operations, an allow list may be placed in the unsealing instructions.
    if (request.command === Command.unsealWithUnsealingKey && parsedUnsealingInstructions) {
      throwIfNotOnAllowList(parsedUnsealingInstructions)
    }
  }
}
