import {
  UsersConsentResponse,
  Exceptions
} from "@dicekeys/dicekeys-api-js";
import {
  ApiPermissionChecks,
} from "../api-handler/api-permission-checks"

describe ("ApiPermissionChecksInstrumentedTest", () => {
  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    new Promise<UsersConsentResponse>( (respond) => respond(response) );

  test ("isClientAuthorizedInFaceOfRestrictionsMostlyHarmless", () => {

    expect(new ApiPermissionChecks("example.com", requestUsersConsent(UsersConsentResponse.Allow))
      .doesClientMeetAuthenticationRequirements({
        allow: [{host: "example.com"}, {host: "other.com"}]
    })).toBe(true);

    expect(new ApiPermissionChecks("example.comspoof", requestUsersConsent(UsersConsentResponse.Allow))
      .doesClientMeetAuthenticationRequirements({
        allow: [{host: "example.com"}, {host: "other.com"}]
    })).toBe(false);

  });

  test("Prevent suffix-extension attack", () => {
    expect(() => {
      new ApiPermissionChecks("example.comspoof", requestUsersConsent(UsersConsentResponse.Allow))
        .throwIfClientNotAuthorized({
          allow: [{host: "example.com"}, {host: "com.other"}]
      });
    }).toThrow(Exceptions.ClientNotAuthorizedException)
  });

  test("Prevent prefix-extension attack", () => {
    expect(() => {
      new ApiPermissionChecks("prefixattackonexample.com", requestUsersConsent(UsersConsentResponse.Allow))
        .throwIfClientNotAuthorized({
          allow: [{host: "example.com"}]
      });
    }).toThrow(Exceptions.ClientNotAuthorizedException)
  });

  test("throws if wrong host", () => {
    expect( () => {
      new ApiPermissionChecks("example.com", requestUsersConsent(UsersConsentResponse.Allow))
      .throwIfClientNotAuthorized({
        allow: [{host: "someplaceotherthanhere.com"}]
      });
    }).toThrow(Exceptions.ClientNotAuthorizedException);
  });
  
});