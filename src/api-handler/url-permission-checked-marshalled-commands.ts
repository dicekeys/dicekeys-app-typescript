import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js"
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  PermissionCheckedMarshalledCommands
} from "./abstract-permission-checked-marshalled-commands"
import {
  urlSafeBase64Decode,
  urlSafeBase64Encode
} from "../api/encodings"
import {
  RequestForUsersConsent,
  UsersConsentResponse,
  ApiStrings
 } from "@dicekeys/dicekeys-api-js";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey"

const {Inputs} = ApiStrings;

/**
 * Wrap the [PermissionCheckedCommands] to unmarshall parameters from the
 * Android Intents (e.g. via `getStringExtra` or `getByteArrayExtra`) and then
 * marshall the Api call's result into a result intent (e.g. via `putExtra`).
 *
 *  The caller is responsible for catching exceptions and marshalling them
 */
export class UrlPermissionCheckedMarshalledCommands extends PermissionCheckedMarshalledCommands {
  constructor(
    protected requestUrl: URL,
    loadDiceKeyAsync: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>,
    private transmitResponse: (response: URL) => any = (response: URL) => this.defaultTransmitResponse(response)
  ) {    
    super(
      // The origin of a URL-protocol request is the origin you are replying to
      // (though this may be supplemented with an url authenticated by an auth token)
      requestUrl.searchParams.get(Inputs.COMMON.respondTo) ?? "",
      // A function to load in the user's dicekey, async so as to allow the user time to
      // scan it in if necessary
      loadDiceKeyAsync,
      // A function that triggers a request for the user's consent.
      requestUsersConsent,
      // Since the URL protocol cannot authenticate the source of a request, it offers
      // the handshake option to increase confidence in the identity of a requester.
      // (it can always know to what address it is sending responses, just not know
      //  where requests are coming from.)
      true,
      // The client-authenticated origin associated with an auth token
      (requestUrl.searchParams.get(Inputs.COMMON.authToken) &&
        DiceKeyAppState.instance!.getUrlForAuthenticationToken(requestUrl.searchParams.get(Inputs.COMMON.authToken)!)) ?? ""
    );
  }

  protected unmarshallOptionalStringParameter = (parameterName: string): string | undefined => {
    const valueStringOrNull = this.requestUrl.searchParams.get(parameterName);
    if (valueStringOrNull == null) {
      return;
    }
    return valueStringOrNull;
  }

  protected unmarshallBinaryParameter = (parameterName: string): Uint8Array => {
    const base64Value  = this.unmarshallStringParameter(parameterName);
    return urlSafeBase64Decode(base64Value);
  }

  private defaultTransmitResponse = (response: URL): any => {
    window.location.replace(response.toString());
  }

  protected sendResponse = (response: [string, string | Uint8Array][]) => {
    const respondTo = this.unmarshallStringParameter(Inputs.COMMON.respondTo);
    if (!respondTo) {
      return;
    }
    const responseUrl = new URL(respondTo);
    response.forEach( ([name, value]) => {
      responseUrl.searchParams.append(name,
        typeof value === "string" ?
          value :
          urlSafeBase64Encode(value)
        );
    });
    this.transmitResponse(responseUrl)
  }

  static executeIfCommand = (
    loadDiceKeyAsync: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>
  ) => {
    const command = new UrlPermissionCheckedMarshalledCommands(
      new URL(window.location.href),
      loadDiceKeyAsync, requestUsersConsent
    );
    if (command.isCommand()) {
      command.execute();
    }    
  }


}
