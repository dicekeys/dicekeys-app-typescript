import {
  Recipe,
  Exceptions,
  UnsealingInstructions,
  WebBasedApplicationIdentity,
  AuthenticationRequirements, ApiCalls
} from "@dicekeys/dicekeys-api-js";
import { Command } from "@dicekeys/dicekeys-api-js/dist/api-calls";
import { extraRequestRecipeAndInstructions } from "./get-requests-recipe";
import {
  doesHostMatchRequirement
} from "./handle-post-message-api-request";

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

export const isUrlOnAllowList = (
  host: string,
  path: string,
  webBasedApplicationIdentities: WebBasedApplicationIdentity[]
): boolean => webBasedApplicationIdentities.some(
  webBasedApplicationIdentity =>
    doesHostMatchRequirement({
      hostExpected: webBasedApplicationIdentity.host,
      hostObserved: host
    }) &&
    (
      ( webBasedApplicationIdentity.paths ?? DefaultPermittedPathList ).some( pathExpected =>
        doesPathMatchRequirement({
          pathExpected, pathObserved: path
        })
      )
    )
);


export const throwIfUrlNotOnAllowList =
  (host: string, path: string, hostValidatedViaAuthToken: boolean) =>
    (requirements: AuthenticationRequirements): void => {
      const {allow = [], requireAuthenticationHandshake} = requirements;
      if (requireAuthenticationHandshake && !hostValidatedViaAuthToken) {
        throw new Exceptions.ClientNotAuthorizedException(`Host authentication required`);
      }
      if (!isUrlOnAllowList(host, path, allow)) {
        throw new Exceptions.ClientNotAuthorizedException(
          `Client ${host} and ${path} is not among list of allowed url: ${JSON.stringify(allow)}`
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

export const throwIfUrlNotPermitted = (host: string, path: string, hostValidatedViaAuthToken: boolean) => {
  const throwIfNotOnAllowList = throwIfUrlNotOnAllowList(host, path, hostValidatedViaAuthToken);
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
