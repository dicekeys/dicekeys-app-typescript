import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  PermissionCheckedMarshalledCommands,
  SeededCryptoObject
} from "./abstract-permission-checked-marshalled-commands"
import {
  urlSafeBase64Decode,
  urlSafeBase64Encode
} from "../api/encodings"
import {
  RequestForUsersConsent,
  UsersConsentResponse,
  ApiStrings,
  SeededCryptoJsObject,
  Exceptions
 } from "@dicekeys/dicekeys-api-js";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey"
import {
  SeededCryptoSerializableObjectStatics
} from "@dicekeys/seeded-crypto-js";
import {
  UrlApiPermissionChecks
} from "./url-api-permission-checks";
const {Inputs} = ApiStrings;

/**
 * Wrap the [PermissionCheckedCommands] to unmarshall parameters from the
 * Android Intents (e.g. via `getStringExtra` or `getByteArrayExtra`) and then
 * marshall the Api call's result into a result intent (e.g. via `putExtra`).
 *
 *  The caller is responsible for catching exceptions and marshalling them
 */
export class UrlPermissionCheckedMarshalledCommands extends PermissionCheckedMarshalledCommands {
  protected response = new Map<string, string>();
  protected readonly searchParams = URL

  constructor(
    protected requestUrl: URL,
    loadDiceKeyAsync: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>,
    private transmitResponse: (response: URL) => any = (response: URL) => this.defaultTransmitResponse(response)
  ) {
    super(
      new UrlApiPermissionChecks(
        requestUrl.searchParams.get(Inputs.COMMON.respondTo) ??
          // Throw exception if no respondto field is passed
          ( () => { throw new Exceptions.MissingParameter(`API missing ${Inputs.COMMON.respondTo} field`);} )(),
        requestUsersConsent,
        // If an authToken was passed, get the corresponding respondTo URL it authorizes
        (requestUrl.searchParams.get(Inputs.COMMON.authToken) &&
          DiceKeyAppState.instance!.getUrlForAuthenticationToken(requestUrl.searchParams.get(Inputs.COMMON.authToken)!)) ?? undefined
      ),
      loadDiceKeyAsync
    );
  }

  protected clearMarshalledResults() {
    this.response.clear();
  }

  protected marshallResult(
    responseParameterName: string,
    value: string | Uint8Array | SeededCryptoObject
  ): PermissionCheckedMarshalledCommands {
    this.response.set(responseParameterName,
      (typeof value === "string") ?
        value :
      (value instanceof Uint8Array) ?
        urlSafeBase64Encode(value) :
        value.toJson()
    );
    return this;
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

  protected unmarshallSeededCryptoObject<
    FIELDS extends SeededCryptoJsObject,
    OBJECT extends SeededCryptoObject
  >(
    objStatic: SeededCryptoSerializableObjectStatics<FIELDS, OBJECT>,
    parameterName: string
  ): OBJECT {
    return objStatic.fromJson(
    this.unmarshallStringParameter(parameterName)
    )
  }

  protected serializeSeededCryptoObject<
    T extends SeededCryptoObject
  >(
    obj: T
  ) {
    return  obj.toJson();
  }

  private defaultTransmitResponse = (response: URL): any => {
    window.location.replace(response.toString());
  }

  protected sendResponse = () => {
    const respondTo = this.unmarshallStringParameter(Inputs.COMMON.respondTo);
    if (!respondTo) {
      return;
    }
    const responseUrl = new URL(respondTo);
    [...this.response.entries()].forEach( ([name, value]) => {
      responseUrl.searchParams.append(name,value);
    });
    this.transmitResponse(responseUrl)
  }

}
