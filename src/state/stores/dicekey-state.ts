// import {
//   SeededCryptoModuleWithHelpers,
// } from "@dicekeys/seeded-crypto-js";
// import {
//   diceKeyIdToNicknameMap
// } from "./known-dicekeys"
// import {
//   PublicKeySet,
//   PopulatePublicKeyCacheFn, populatePublicKeyCacheFnFactory
// } from "./public-key-set";
import { autoSave } from "../core/AutoSave";
import { makeAutoObservable } from "mobx";

export class DiceKeyStateStore {

  constructor(
    protected readonly keyId: string
  ) {
    makeAutoObservable(this);
    autoSave(this, `DiceKeyStateStore:${keyId}`)
  }

  centerDieHumanReadableForm?: string;
  hasBeenReadWithoutError: boolean = false;
  hasBeenBackedUpToWords: boolean = false;
  hasBeenBackedUpToReplica: boolean = false;
  dontAskAboutBackupAgain: boolean = false;
  
  // get hasSealingKey() { return (this.publicKeySet?.sealingKeys.length ?? 0) > 0 }
  // get hasSignatureVerificationKey() { return (this.publicKeySet?.signatureVerificationKeys.length ?? 0) > 0 }

  private static instances = new Map<string, DiceKeyStateStore>();
  static instanceFor = (
    keyId: string
  ) => {
    if (!DiceKeyStateStore.instances.has(keyId)) {
      DiceKeyStateStore.instances.set(keyId, new DiceKeyStateStore(keyId))
    }
    return DiceKeyStateStore.instances.get(keyId)!;
  }
}