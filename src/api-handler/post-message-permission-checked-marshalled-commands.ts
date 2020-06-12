import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  RequestForUsersConsent,
  UsersConsentResponse,
  Exceptions,
  SeededCryptoJsObject,
} from "@dicekeys/dicekeys-api-js";
import {
  PermissionCheckedMarshalledCommands,
  SeededCryptoObject
} from "./abstract-permission-checked-marshalled-commands"
import {
  SeededCryptoSerializableObjectStatics
} from "@dicekeys/seeded-crypto-js";
/**
 * 
 */
export class PostMessagePermissionCheckedMarshalledCommands extends PermissionCheckedMarshalledCommands {
  response: {[parameterName: string]: string | Uint8Array | SeededCryptoJsObject} = {}

  constructor(
    protected request: MessageEvent,
    loadDiceKeyAsync: () => PromiseLike<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>,
    private transmitResponse: (response: object) => any = (response: object) => this.defaultTransmitResponse(response)
  ) {
    super(request.origin + "/", loadDiceKeyAsync, requestUsersConsent, false);
  }

  protected clearMarshalledResults() {
    this.response = {}
  }

  protected marshallResult(
    responseParameterName: string,
    value: string | Uint8Array | SeededCryptoObject
  ): PermissionCheckedMarshalledCommands {
    this.response[responseParameterName] =
      (typeof value === "string" || value instanceof Uint8Array) ?
        value :
        value.toJsObject();
    return this;
  }

  protected unmarshallOptionalStringParameter = (parameterName: string): string | undefined => {
    const value = typeof (this.request?.data) === "object" && this.request?.data[parameterName];
    return (typeof value) === "string" ? value : undefined;
  }

  protected unmarshallBinaryParameter = (parameterName: string): Uint8Array => {
    const value = typeof (this.request?.data) === "object" && this.request?.data[parameterName];
    return ((typeof value) === "object" && (value instanceof Uint8Array)) ?
      value :
      (() => { throw Exceptions.MissingParameter.create(parameterName); })();
  }

  protected unmarshallSeededCryptoObject<
    FIELDS extends SeededCryptoJsObject,
    OBJECT extends SeededCryptoObject
  >(
    objStatic: SeededCryptoSerializableObjectStatics<FIELDS, OBJECT>,
    parameterName: string
  ): OBJECT { return objStatic.fromJsObject(
      ( typeof (this.request?.data) === "object" &&
      typeof this.request.data[parameterName] === "object" &&
      (!(this.request.data[parameterName] instanceof Uint8Array))
    ) ?
      this.request.data[parameterName] :
      (() => { throw Exceptions.MissingParameter.create(parameterName); })()
    );
  }

  protected serializeSeededCryptoObject<
    T extends SeededCryptoObject
  >(
    obj: T
  ) {
    return  obj.toJsObject();
  }

  private defaultTransmitResponse = (response: object): any => {
    /**
     * Transmit the response back to the origin it came from
     */
    ( this.request.source as {postMessage: (m: any, origin: string) => unknown})!.postMessage(response, this.request.origin);
  }

  protected sendResponse = () => {
    this.transmitResponse(this.response)
  }

  static executeIfCommand = (
    loadDiceKeyAsync: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>,
    messageEvent: MessageEvent
  ) => {
    const command = new PostMessagePermissionCheckedMarshalledCommands(
      messageEvent,
      loadDiceKeyAsync, requestUsersConsent
    );
    if (command.isCommand()) {
      command.execute();
    }    
  }

}
