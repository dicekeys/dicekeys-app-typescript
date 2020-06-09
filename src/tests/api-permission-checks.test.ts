import {
  RequestForUsersConsent,
  UsersConsentResponse
} from "@dicekeys/dicekeys-api-js";
import {
  ApiPermissionChecks,
  ClientUriNotAuthorizedException
} from "../api-handler/permission-checks"

describe ("ApiPermissionChecksInstrumentedTest", () => {
  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    new Promise<UsersConsentResponse>( (respond) => respond(response) );

  test ("isClientAuthorizedInFaceOfRestrictionsMostlyHarmless", () => {

    expect(new ApiPermissionChecks("https://example.com/", requestUsersConsent(UsersConsentResponse.Allow))
      .doesClientMeetAuthenticationRequirements({
        urlPrefixesAllowed: ["https://example.com/", "https://other.com/"]
    })).toBe(true);

    expect(new ApiPermissionChecks("https://example.comspoof/", requestUsersConsent(UsersConsentResponse.Allow))
      .doesClientMeetAuthenticationRequirements({
        urlPrefixesAllowed: ["https://example.com/", "https://other.com/"]
    })).toBe(false);

  });

  test("preventsLengthExtensionAttack", () => {
    expect(() => {
      new ApiPermissionChecks("https://example.comspoof/", requestUsersConsent(UsersConsentResponse.Allow))
        .throwIfClientNotAuthorized({
          urlPrefixesAllowed: ["example.com/", "com.other/"]
      });
    }).toThrow(ClientUriNotAuthorizedException)
  });

  test("throwsIfAndroidPackagePrefixesNotSet", () => {
    expect( () => {
      new ApiPermissionChecks("https://example.com", requestUsersConsent(UsersConsentResponse.Allow))
      .throwIfClientNotAuthorized({
        urlPrefixesAllowed: ["https://someplaceotherthanhere.com/"]
      });
    }).toThrow(ClientUriNotAuthorizedException);
  });
  
});