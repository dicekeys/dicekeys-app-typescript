import {
  DerivationOptions,
  ApiCalls,
  ApiStrings,
  Exceptions,
  UnsealingInstructions
} from "@dicekeys/dicekeys-api-js";
import {
  WebBasedApplicationIdentity
} from "@dicekeys/dicekeys-api-js";

export const doesHostMatchRequirement = (
  {hostExpected, hostObserved}: {hostExpected: string, hostObserved: string}
) =>
  // (A)
  // Tthere is no "*." prefix in the hostExpected specification so an exact
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
    (allowList: WebBasedApplicationIdentity[] | undefined): void => {
      if (allowList == null) {
        // There's no allow list requirement so host can't be forbidden
        return;
      }
      if (!isHostOnAllowList(host, allowList)) {
        throw new Exceptions.ClientNotAuthorizedException(
          `Client ${host} is not among list of allowed hosts: ${JSON.stringify(allowList)}`
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
    if (
      request.command === ApiStrings.Commands.unsealWithSymmetricKey ||
      request.command === ApiStrings.Commands.unsealWithUnsealingKey
    ) {
      // Unsealing operations have two possible allow lists, both embedded in the packageSealedMessage parameter:
      //   - like all other operations, an allow list may be placed in derivation options.
      //   = unique to these operations, an allow list may be placed in the unsealing instructions.
      throwIfNotOnAllowList(DerivationOptions(request.packagedSealedMessageFields.derivationOptionsJson).allow);
      const unsealingInstructions = UnsealingInstructions(request.packagedSealedMessageFields.unsealingInstructions);
      throwIfNotOnAllowList(unsealingInstructions.allow);
      if (unsealingInstructions.requireUsersConsent) {
        // FIXME
        // if ((await this.requestUsersConsent(requireUsersConsent)) !== UsersConsentResponse.Allow) {
        //   throw new Exceptions.UserDeclinedToAuthorizeOperation("Operation declined by user")
        // }
      }
    } else {
      // The list of allowed web identities is specified via the allow field of the derivation options.
      throwIfNotOnAllowList(DerivationOptions(request.derivationOptionsJson).allow);
    }
  }
}
