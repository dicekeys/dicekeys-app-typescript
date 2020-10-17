import {
  EncryptedAppStateStore,
  TabsAndWindowsSharingThisState,
} from "../web-component-framework/locally-stored-state";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  SeededCryptoModuleWithHelpers,
  SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
import {
  urlSafeBase64Encode
} from "@dicekeys/dicekeys-api-js";
import {
  randomBytes
} from "crypto";

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
        this.diceKey.remove();
      }
    });
  }

  /**
   * 
   */
  public readonly diceKey = this.addEncryptedField<DiceKey>("dicekey");
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

