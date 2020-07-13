import {
  DerivationOptions,
  ApiCalls,
  ApiStrings,
  Exceptions,
  UnsealingInstructions
} from "@dicekeys/dicekeys-api-js";
import {
  WebBasedApplicationIdentity
} from "@dicekeys/dicekeys-api-js"
// import {
//   PermissionCheckedSeededApiCommand
// } from "./permission-checked-seeded-api-request";
// import { SeededCryptoModuleWithHelpers } from "@dicekeys/seeded-crypto-js";

export const isHostOnAllowList = (
  host: string,
  webBasedApplicationIdentities: WebBasedApplicationIdentity[]
): boolean => {

  return webBasedApplicationIdentities.some( (webBasedApplicationIdentity => {
    const hostSpecified = webBasedApplicationIdentity.host;
    return hostSpecified.startsWith("*.") ?
      // If prefix matching specified, match subdomains as well as the exact domain
      (
        // match subdomains such that sub.example.com satisfies *.example.com
        // by testing for suffix ".example.com"
        host.endsWith(hostSpecified.substr(1)) ||
        // or if no subdomain (e.g. "example.com" satisfies "*.example.com")
        // by testing exact match (e.g. both strings equal "example.com")
        host === hostSpecified.substr(2)
      ) :
      // hostSpecified is for exact match (it doesn't start with *.)
      host === hostSpecified;
  }));
}

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
      throwIfNotOnAllowList(DerivationOptions(request.packagedSealedMessage.derivationOptionsJson).allow);
      const unsealingInstructions = UnsealingInstructions(request.packagedSealedMessage.unsealingInstructions);
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

// export const PostMessagePermissionCheckedSeededApiCommandFactory =
//   (seededCrypto: SeededCryptoModuleWithHelpers) =>
//     (host: string, seedString: string) =>
//         new PermissionCheckedSeededApiCommand(
//           seededCrypto,
//           throwIfHostNotPermitted(host),
//           seedString
//         );
