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
 * Wrap the [PermissionCheckedCommands] to unmarshall parameters from the
 * Android Intents (e.g. via `getStringExtra` or `getByteArrayExtra`) and then
 * marshall the Api call's result into a result intent (e.g. via `putExtra`).
 *
 *  The caller is responsible for catching exceptions and marshalling them
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
    super(seededCryptoModule, loadDiceKey, requestUsersConsent);
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

  protected sendResponse = (response: [string, string][]) => {
    const responseObj =
    response.reduce( (responseObj, [name, value]) => {
        responseObj[name] = value;
        return responseObj;
      },
      {} as {[name: string]: string}
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
