import {
  Exceptions,
  SeededCryptoJsObject,
} from "@dicekeys/dicekeys-api-js";
import {
  PermissionCheckedMarshalledCommands,
  SeededCryptoObject
} from "./abstract-permission-checked-marshalled-commands"
import {
  SeededCryptoSerializableObjectStatics, SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  ApiPermissionChecks, RequestForUsersConsentFn
} from "./api-permission-checks";
import { GetUsersApprovalOfApiCommand } from "./permission-checked-seed-accessor";
/**
 * 
 */
export class PostMessagePermissionCheckedMarshalledCommands extends PermissionCheckedMarshalledCommands {
  response: {[parameterName: string]: string | Uint8Array | SeededCryptoJsObject} = {}

  constructor(
    protected request: MessageEvent,
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    requestUsersConsent: RequestForUsersConsentFn,
    getUsersApprovalOfApiCommand: GetUsersApprovalOfApiCommand,
    private transmitResponse: (response: object) => any = (response: object) => this.defaultTransmitResponse(response)
  ) {
    super(
      seededCryptoModule,
      new ApiPermissionChecks(
        request.origin.startsWith("https://") ?
          request.origin.substr(8) :
          ( () => {throw new Exceptions.ClientNotAuthorizedException("API requests must be sent via https://");} )(),
          requestUsersConsent,
      ),
      getUsersApprovalOfApiCommand
    );
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

  protected unmarshallOptionalNumberParameter = (parameterName: string): number | undefined => {
    const value = typeof (this.request?.data) === "object" && this.request?.data[parameterName];
    if (typeof value === "string") {
      return parseInt(value);
    }
    return;
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

  private defaultTransmitResponse = (response: object): any => {
    /**
     * Transmit the response back to the origin it came from
     */
    ( this.request.source as {postMessage: (m: any, origin: string) => unknown})!.postMessage(response, this.request.origin);
  }

  protected sendResponse = () => {
    this.transmitResponse(this.response)
  }

}
