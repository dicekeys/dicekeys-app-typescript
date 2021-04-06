import {
  DiceKey
} from "../dicekeys/dicekey";
import { action, makeAutoObservable } from "mobx";
import { autoSave, autoSaveEncrypted } from "./core/auto-save";
import { AllAppWindowsAndTabsAreClosingEvent } from "./core/all-windows-closing-event";

export const DiceKeyStore = new (class DiceKeyStore {
  diceKeysByKeyId: {[keyId: string]: DiceKey} = {};

  addDiceKeyForKeyId = action ( (keyId: string, diceKey: DiceKey) => {
    this.diceKeysByKeyId[keyId] = diceKey;
  });

  addDiceKey = async (diceKey: DiceKey) =>
    this.addDiceKeyForKeyId(await DiceKey.keyId(diceKey), diceKey);

  removeDiceKeyForKeyId = action ( (keyId: string) => {
    delete this.diceKeysByKeyId[keyId];
  });

  removeDiceKey = async (diceKeyOrKeyId: DiceKey | string) => {
    const keyId = typeof(diceKeyOrKeyId) === "string" ? diceKeyOrKeyId : await DiceKey.keyId(diceKeyOrKeyId);
    this.removeDiceKeyForKeyId(keyId);
  };

  removeAll = action ( () => {
    this.diceKeysByKeyId = {}
  });
  
  constructor() {
    makeAutoObservable(this);
    autoSaveEncrypted(this, "DiceKeyStore");
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
})();

export class CurrentDiceKeyState {
  constructor() {
    makeAutoObservable(this);
    autoSave(this, "CurrentDiceKeyState");
  }

  keyId: string | undefined;
  public get diceKey(): DiceKey | undefined {
    return this.keyId ? DiceKeyStore.diceKeysByKeyId[this.keyId] : undefined;
  };

  public get seed(): string | undefined { 
    const diceKey = this.diceKey;
    return (diceKey == null) ? undefined : DiceKey.toSeedString(diceKey, true)
  }

  setKeyId = action( (keyId?: string) => {
    this.keyId = keyId;
  });

  setDiceKey = async (diceKey?: DiceKey) => {
    if (typeof diceKey === "undefined") {
      this.setKeyId();
    } else {
      const keyId = await DiceKey.keyId(diceKey);
      DiceKeyStore.addDiceKeyForKeyId(keyId, diceKey);
    }
  }
}
  

// class AuthenticationTokens {

//   constructor() {
//     makeAutoObservable(this);
//     autoSaveEncrypted(this, "AuthenticationTokens");\    
//   }

//   private static authenticationFieldName = (authenticationToken: string) =>
//     `authenticationToken:${authenticationToken}`;

  
//   addAuthenticationToken = (respondToUrl: string): string => {
//     const authToken: string = ((): string => {
//       if (global.window && window.crypto) {
//         const randomBytes = new Uint8Array(20);
//         crypto.getRandomValues(randomBytes);
//         return urlSafeBase64Encode(randomBytes);
//       } else {
//         return urlSafeBase64Encode((randomBytes(20)));
//       }
//     })();
//     const field = this.addEncryptedField<string>(EncryptedCrossTabState.authenticationFieldName(authToken));
//     field.value = respondToUrl;
//     return authToken;
//   };

//   getUrlForAuthenticationToken = (
//     authToken: string
//   ) : string | undefined =>
//     this.addEncryptedField<string>(EncryptedCrossTabState.authenticationFieldName(authToken)).value;


//   private static instanceWritable: EncryptedCrossTabState | undefined;
//   public static readonly instancePromise: Promise<EncryptedCrossTabState> = (async () => {
//     const seededCryptoModule = await SeededCryptoModulePromise;
//     EncryptedCrossTabState.instanceWritable = new EncryptedCrossTabState(
//       seededCryptoModule,
//       defaultAppStageExpirationTimeInMinutes
//     );
//     return EncryptedCrossTabState.instanceWritable;
//   })();
//   public static get instance(): EncryptedCrossTabState | undefined {
//     return EncryptedCrossTabState.instanceWritable;
//   }
// }

