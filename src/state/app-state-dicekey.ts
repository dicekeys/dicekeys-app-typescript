import {
  EncryptedAppStateStore,
  TabsAndWindowsSharingThisState,
} from "./locally-stored-state";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  SeededCryptoModuleWithHelpers,
  SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
import { urlSafeBase64Encode } from "../api/encodings";
import {randomBytes} from "crypto";

const defaultAppStageExpirationTimeInMinutes = 30;

export class DiceKeyAppState extends EncryptedAppStateStore {
  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    expireAfterMinutesUnused: number
  ) {
    super (seededCryptoModule, expireAfterMinutesUnused);
    // Erase the DiceKey if all windows are closed.
    window.addEventListener("unload", () => {
      if (this.windowsOpen.countOfOthers === 0 && window.origin.indexOf("localhost") === -1 ) {
        this.diceKey.remove();
      }
    });
  }

  public readonly diceKey = this.addEncyrptedField<DiceKey>("dicekey");
  public readonly windowsOpen = new TabsAndWindowsSharingThisState("windows-sharing-dicekeys-app-state");

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
    const field = this.addEncyrptedField<string>(DiceKeyAppState.authenticationFieldName(authToken));
    field.set(respondToUrl);
    return authToken;
  };

  getUrlForAuthenticationToken = (
    authToken: string
  ) : string | undefined =>
    this.addEncyrptedField<string>(DiceKeyAppState.authenticationFieldName(authToken)).get();


  private static instanceWritable: DiceKeyAppState | undefined;
  public static readonly instancePromise: Promise<DiceKeyAppState> = (async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    DiceKeyAppState.instanceWritable = new DiceKeyAppState(
      seededCryptoModule,
      defaultAppStageExpirationTimeInMinutes
    );
    return DiceKeyAppState.instanceWritable;
  })();
  public static get instance(): DiceKeyAppState | undefined {
    return DiceKeyAppState.instanceWritable;
  }
}

