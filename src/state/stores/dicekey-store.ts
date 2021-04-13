import {
  DiceKey
} from "../../dicekeys/dicekey";
import { action, makeAutoObservable } from "mobx";
import { autoSaveEncrypted } from "../core/auto-save";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/all-windows-closing-event";

export const DiceKeyStore = new (class DiceKeyStore {
  protected diceKeysByKeyId: {[keyId: string]: DiceKey} = {};

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

  get keyIds(): string[] { return Object.keys(this.diceKeysByKeyId) }

  get keysIdsAndNicknames() {
    return Object.entries(this.diceKeysByKeyId)
      .map( ([keyId, diceKey]) =>
        ({keyId, nickname: DiceKey.nickname(diceKey) })
      );
  }
 
  diceKeyForKeyId = (keyId: string): DiceKey | undefined => this.diceKeysByKeyId[keyId];

  constructor() {
    makeAutoObservable(this);
    autoSaveEncrypted(this, "DiceKeyStore");
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
})();
