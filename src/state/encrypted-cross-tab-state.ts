import {
  EncryptedAppStateStore,
  TabsAndWindowsSharingThisState,
} from "../web-component-framework/locally-stored-state";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  SeededCryptoModuleWithHelpers,
  SeededCryptoModulePromise,
} from "@dicekeys/seeded-crypto-js";
import {
  urlSafeBase64Encode
} from "@dicekeys/dicekeys-api-js";
import {
  randomBytes
} from "crypto";
import {
  DiceKeyStateStore
} from "./dicekey-state";

const defaultAppStageExpirationTimeInMinutes = 30;



export class EncryptedCrossTabState extends EncryptedAppStateStore {
  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    expireAfterMinutesUnused: number
  ) {
    super (seededCryptoModule, expireAfterMinutesUnused);
    // Erase the DiceKey if all windows are closed.
    window.addEventListener("unload", () => {
      if (this.windowsOpen.countOfOthers === 0 && window.origin.indexOf("localhost") === -1 ) {
        this.diceKeyField.remove();
      }
    });
  }

  /**
   * 
   */
  #keyId: string | undefined;
  #diceKeyState: DiceKeyStateStore | undefined;
  public readonly diceKeyField = this.addEncryptedField<DiceKey>("dicekey");
  public get diceKey(): DiceKey | undefined { return this.diceKeyField.value; }
  public set diceKey(diceKey: DiceKey | undefined) {
    // Remove any observables and use a pure Face now that the DiceKey is final.
    diceKey = diceKey?.map( ({letter, digit, orientationAsLowercaseLetterTrbl}) =>
      ({letter, digit, orientationAsLowercaseLetterTrbl}) ) as DiceKey;
    this.#keyId = diceKey == null ? undefined :
      urlSafeBase64Encode(
        this.seededCryptoModule.Secret.deriveFromSeed(DiceKey.toSeedString(diceKey, true), "").secretBytes
      );
    this.#diceKeyState = this.#keyId == undefined ? undefined :
        DiceKeyStateStore.instanceFor(this.seededCryptoModule, this.#keyId);
    this.diceKeyField.set(diceKey);
  }
  public forgetDiceKey = (): void => {
    this.diceKeyField.remove();
    this.#keyId = undefined;
    this.#diceKeyState = undefined;
  }

  public readonly windowsOpen = new TabsAndWindowsSharingThisState("windows-sharing-dicekeys-app-state");

  
  public get keyId() { return this.#keyId; }
  public get diceKeyState() { return this.#diceKeyState }
  


  private static authenticationFieldName = (authenticationToken: string) =>
    `authenticationToken:${authenticationToken}`;

  
  addAuthenticationToken = (respondToUrl: string): string => {
    const authToken: string = ((): string => {
      if (global.window && window.crypto) {
        const randomBytes = new Uint8Array(20);
        crypto.getRandomValues(randomBytes);
        return urlSafeBase64Encode(randomBytes);
      } else {
        return urlSafeBase64Encode((randomBytes(20)));
      }
    })();
    const field = this.addEncryptedField<string>(EncryptedCrossTabState.authenticationFieldName(authToken));
    field.value = respondToUrl;
    return authToken;
  };

  getUrlForAuthenticationToken = (
    authToken: string
  ) : string | undefined =>
    this.addEncryptedField<string>(EncryptedCrossTabState.authenticationFieldName(authToken)).value;


  private static instanceWritable: EncryptedCrossTabState | undefined;
  public static readonly instancePromise: Promise<EncryptedCrossTabState> = (async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    EncryptedCrossTabState.instanceWritable = new EncryptedCrossTabState(
      seededCryptoModule,
      defaultAppStageExpirationTimeInMinutes
    );
    return EncryptedCrossTabState.instanceWritable;
  })();
  public static get instance(): EncryptedCrossTabState | undefined {
    return EncryptedCrossTabState.instanceWritable;
  }
}

