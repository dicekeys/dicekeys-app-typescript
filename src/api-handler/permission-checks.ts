
import {
  AuthenticationRequirements,
  RequestForUsersConsent,
  UnsealingInstructions,
  UsersConsentResponse
} from "@dicekeys/dicekeys-api-js";

export class ClientUriNotAuthorizedException extends Error {
  constructor(
    public readonly url: string,
    public readonly urlPrefixesAllowed: string[]
  ) {
    super(`Client at url ${url} does not start with prefix from list [${urlPrefixesAllowed.join(", ")}]`);
  }
}

export class UserDeclinedToAuthorizeOperation extends Error {}

/**
 * Abstract away all permissions checks for the DiceKeys API
 *
 * @param requestUsersConsent You must pass this function, which is
 * called if a message must be shown to the user which will allow them to choose whether
 * to return unsealed data or not.  Your function should return true if the user has
 * already authorized the action, false if they rejected the action, or throw an exception
 * if waiting for the action to complete.
 */
export class ApiPermissionChecks {
  constructor(
      private readonly origin: string,
      private readonly requestUsersConsent: (
          requestForUsersConsent: RequestForUsersConsent
        ) => Promise<UsersConsentResponse>,
      private protocolMayRequireHandshakes: boolean = false,
      private handshakeAuthenticatedUrl?: string,  
  ) {}

  doesClientMeetAuthenticationRequirements = (
      {urlPrefixesAllowed, requireAuthenticationHandshake}: AuthenticationRequirements
    ): boolean =>
      urlPrefixesAllowed == null ||
      urlPrefixesAllowed.some( prefix =>
        // If the prefix appears in the URL associated with the authentication token
        (this.handshakeAuthenticatedUrl != null && this.handshakeAuthenticatedUrl.startsWith(prefix)) ||
        // Or no handshake is required and the replyUrl starts with the prefix
        ((!this.protocolMayRequireHandshakes || !requireAuthenticationHandshake) && this.origin.startsWith(prefix))
      )
          
    
  throwIfClientNotAuthorized(
    authenticationRequirements: AuthenticationRequirements
  ): void {
    if (!this.doesClientMeetAuthenticationRequirements(authenticationRequirements)) {
      // The client application id does not start with any of the specified prefixes
      throw new ClientUriNotAuthorizedException(
        authenticationRequirements?.requireAuthenticationHandshake && this.protocolMayRequireHandshakes ?
          (this.handshakeAuthenticatedUrl || "") :
          this.origin,
        authenticationRequirements?.urlPrefixesAllowed || [])
    }
  }
  

  /**
   * Verify that UnsealingInstructions do not forbid the client from using
   * unsealing a message.  If the client is not authorized,
   * throw a [[ClientNotAuthorizedException]].
   *
   * @throws ClientNotAuthorizedException
   */
  throwIfUnsealingInstructionsViolatedAsync = async (
    unsealingInstructionsAsObjectOrJson?: UnsealingInstructions | string
  ): Promise<void> => {
    if (!unsealingInstructionsAsObjectOrJson)
      return;
    const unsealingInstructions = UnsealingInstructions(unsealingInstructionsAsObjectOrJson);
    
    this.throwIfClientNotAuthorized(unsealingInstructions);
    const {requireUsersConsent} = unsealingInstructions;
    if (!requireUsersConsent) return;
    if ((await this.requestUsersConsent(requireUsersConsent)) !== UsersConsentResponse.Allow) {
      throw new UserDeclinedToAuthorizeOperation("Operation declined by user")
    }
  }
  
}