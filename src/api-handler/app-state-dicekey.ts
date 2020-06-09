import {
  EncryptedAppStateStore
} from "./encrypted-app-state-store";
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
  }

  private static diceKeyFieldName = "diceKey";
  public get diceKey(): DiceKey | undefined {
    return this.getEncryptedField<DiceKey>(DiceKeyAppState.diceKeyFieldName);
  }
  public set diceKey(value: DiceKey | undefined) {
    this.setEncryptedField<DiceKey | undefined>(DiceKeyAppState.diceKeyFieldName, value);
  }
  public eraseDiceKey() {
    this.removeEncryptedField(DiceKeyAppState.diceKeyFieldName);
  }

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
    this.setEncryptedField<string>(DiceKeyAppState.authenticationFieldName(authToken), respondToUrl);
    return authToken;
  };

  getUrlForAuthenticationToken = (
    authToken: string
  ) : string | undefined =>
    this.getEncryptedField<string>(DiceKeyAppState.authenticationFieldName(authToken));



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

