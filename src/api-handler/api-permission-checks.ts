
import {
  AuthenticationRequirements,
  RequestForUsersConsent,
  UnsealingInstructions,
  UsersConsentResponse,
  WebBasedApplicationIdentity,
  Exceptions
} from "@dicekeys/dicekeys-api-js";

/**
 * Permissions checks for the DiceKeys PostMessage API
 * 
 * The PostMessage API authenticates via the host alone.
 * The URL API extends this class to check paths.
 *
 * @param requestUsersConsent You must pass this function, which is
 * called if a message must be shown to the user which will allow them to choose whether
 * to return unsealed data or not.  Your function should return true if the user has
 * already authorized the action, false if they rejected the action, or throw an exception
 * if waiting for the action to complete.
 */
export class ApiPermissionChecks {
  constructor(
      protected readonly host: string,
      private readonly requestUsersConsent: (
          requestForUsersConsent: RequestForUsersConsent
        ) => Promise<UsersConsentResponse>,
  ) {}

  validateIdentity(id: WebBasedApplicationIdentity) {
    const hostSpecified = id.host;
    return hostSpecified.startsWith("*.") ?
      // If prefix matching specified, match subdomains as well as the exact domain
      (
        // match subdomains such that sub.example.com satisfies *.example.com
        // by testing for suffix ".example.com"
        this.host.endsWith(hostSpecified.substr(1)) ||
        // or if no subdomain (e.g. "example.com" satisfies "*.example.com")
        // by testing exact match (e.g. both strings equal "example.com")
        this.host === hostSpecified.substr(2)
      ) :
      // hostSpecified is for exact match (it doesn't start with *.)
      this.host === hostSpecified;
  }
 
  public doesClientMeetAuthenticationRequirements(
    {allow}: AuthenticationRequirements
  ): boolean {
    return allow == null ||
    allow.some( (webBasedApplicationIdentity) => this.validateIdentity(webBasedApplicationIdentity) )
  }

  throwIfClientNotAuthorized(
    authenticationRequirements: AuthenticationRequirements
  ): void {
    if (!this.doesClientMeetAuthenticationRequirements(authenticationRequirements)) {
      // The client application id does not start with any of the specified prefixes
      throw new Exceptions.ClientNotAuthorizedException(
        `Client ${this.host} does not meet authentication requirements: ${JSON.stringify(authenticationRequirements)}`
      );
    }
  }
  
  /**
   * Verify that UnsealingInstructions do not forbid the client from using
   * unsealing a message.  If the client is not authorized,
   * throw a [[ClientNotAuthorizedException]].
   *
   * @throws ClientNotAuthorizedException
   */
  async throwIfUnsealingInstructionsViolatedAsync(
    unsealingInstructionsAsObjectOrJson?: UnsealingInstructions | string
  ): Promise<void> {
    if (!unsealingInstructionsAsObjectOrJson)
      return;
    const unsealingInstructions = UnsealingInstructions(unsealingInstructionsAsObjectOrJson);
    
    this.throwIfClientNotAuthorized(unsealingInstructions);
    const {requireUsersConsent} = unsealingInstructions;
    if (!requireUsersConsent) return;
    if ((await this.requestUsersConsent(requireUsersConsent)) !== UsersConsentResponse.Allow) {
      throw new Exceptions.UserDeclinedToAuthorizeOperation("Operation declined by user")
    }
  }
}
