
import {
  AuthenticationRequirements,
  RequestForUsersConsent,
  UsersConsentResponse,
  WebBasedApplicationIdentity,
} from "@dicekeys/dicekeys-api-js";
import {
  ApiPermissionChecks
} from "./api-permission-checks";


export class UrlApiPermissionChecks extends ApiPermissionChecks {
  protected readonly authenticatedByHandshake: boolean;
  protected readonly path: string;
  constructor(
    readonly respondToUrl: string,
    requestUsersConsent: (
        requestForUsersConsent: RequestForUsersConsent
      ) => Promise<UsersConsentResponse>,
    handshakeAuthenticatedUrl?: string,  
) {
  super(
    new URL(respondToUrl).host,
    requestUsersConsent
  );
  this.authenticatedByHandshake = respondToUrl === handshakeAuthenticatedUrl;
  this.path = new URL(respondToUrl).pathname;
}

/**
 * Validate whether this url matches a WebBasedApplicationIdentity
 * 
 * @param webBasedAppIdentity 
 */
validateIdentity(
  webBasedAppIdentity: WebBasedApplicationIdentity
): boolean {
  // The inherited class will check the host requirement.
  if (!super.validateIdentity(webBasedAppIdentity)) {
    // Return false if that validation failed.
    return false;
  }
  
  // Determine if there is a path requirement.
  if (webBasedAppIdentity.paths == null) {
    // This identity requirement doesn't specify a paths requirement,
    // so the success of the prior validation is sufficient.
    return true;
  }

  // The identity contains a set of paths, one of which must match.
  // Return true if any path matches and false otherwise.
  return webBasedAppIdentity.paths?.some( pathRequirement => {
    if (pathRequirement.length > 0 && pathRequirement[0] != "/") {
      // Paths must start with a "/".  If the path requirement didn't start with a "/",
      // we'll insert one assuming this was a user error.
      pathRequirement = "/" + pathRequirement;
    }
    if (pathRequirement.endsWith("*")) {
      // The path reqquirement specifies a prefix, so test for a prefix match
      return this.path.startsWith(pathRequirement.substr(0, pathRequirement.length -1));
    } else {
      // This path requirement does not specify a prefix, so test for exact match
      return pathRequirement === this.path;
    }
  });
}

  doesClientMeetAuthenticationRequirements(
      authenticationRequirements: AuthenticationRequirements
  ): boolean {
    if (authenticationRequirements.requireAuthenticationHandshake && !this.authenticatedByHandshake) {
      // Client has not performed an authentication handshake
      return false;
    }
    return super.doesClientMeetAuthenticationRequirements(authenticationRequirements);
  }
    
}