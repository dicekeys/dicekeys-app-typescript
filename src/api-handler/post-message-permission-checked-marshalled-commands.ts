import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js"
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  RequestForUsersConsent,
  UsersConsentResponse
} from "../api/unsealing-instructions";
import {
  PermissionCheckedMarshalledCommands
} from "./abstract-permission-checked-marshalled-commands"

/**
 * 
 */
export class PostMessagePermissionCheckedMarshalledCommands extends PermissionCheckedMarshalledCommands {
  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    protected request: MessageEvent,
    loadDiceKey: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>,
    private transmitResponse: (response: object) => any = (response: object) => this.defaultTransmitResponse(response)
  ) {
    super(seededCryptoModule, request.origin, loadDiceKey, requestUsersConsent, false);
  }

  protected unmarshallOptionalStringParameter = (parameterName: string): string | undefined => {
    const value = typeof (this.request?.data) === "object" && this.request?.data[parameterName];
    return (typeof value) === "string" ? value : undefined;
  }
  protected unmarshallBinaryParameter = (parameterName: string): Uint8Array => {
    const value = typeof (this.request?.data) === "object" && this.request?.data[parameterName];
    return ((typeof value) === "object" && (value instanceof Uint8Array)) ?
      value :
      (() => { throw new Error("Missing parameter"); })();
  }

  private defaultTransmitResponse = (response: object): any => {
    /**
     * Transmit the response back to the origin it came from
     */
    window.postMessage(response, this.request.origin)
  }

  protected sendResponse = (response: [string, string | Uint8Array][]) => {
    const responseObj =
      response.reduce( (responseObj, [name, value]) => {
          responseObj[name] = value;
          return responseObj;
        },
        {} as {[name: string]: string | Uint8Array}
      );
    this.transmitResponse(responseObj)
  }

  static executeIfCommand = async (
    loadDiceKey: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>,
    messageEvent: MessageEvent
  ) => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    const command = new PostMessagePermissionCheckedMarshalledCommands(
      seededCryptoModule,
      messageEvent,
      loadDiceKey, requestUsersConsent
    );
    if (command.isCommand()) {
      command.execute();
    }    
  }

}
