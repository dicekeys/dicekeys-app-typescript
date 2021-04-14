import {
  DiceKey
} from "../../dicekeys/DiceKey";
import { action, makeAutoObservable, toJS } from "mobx";
import { autoSaveEncrypted } from "../core/AutoSave";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";
import { isRunningInPreviewMode } from "~utilities/is-preview";

export const DiceKeyMemoryStore = new (class DiceKeyMemoryStore {
  static objIdS: number = 1;
  protected objId = DiceKeyMemoryStore.objIdS++;

  protected diceKeysByKeyId: {[keyId: string]: DiceKey};

  addDiceKeyForKeyId = action ( (keyId: string, diceKey: DiceKey) => {
    console.log(`addDiceKeyForKeyId(${keyId}) ${diceKey}`);
    this.diceKeysByKeyId[keyId] = diceKey;
  });

  addDiceKey = async (diceKey: DiceKey) =>
    this.addDiceKeyForKeyId(await DiceKey.keyId(diceKey), diceKey);

  removeDiceKeyForKeyId = action ( (keyId: string) => {
    console.log(`removeDiceKeyForKeyId(${keyId})`);
    delete this.diceKeysByKeyId[keyId];
  });

  removeDiceKey = async (diceKeyOrKeyId: DiceKey | string) => {
    const keyId = typeof(diceKeyOrKeyId) === "string" ? diceKeyOrKeyId : await DiceKey.keyId(diceKeyOrKeyId);
    this.removeDiceKeyForKeyId(keyId);
  };

  removeAll = action ( () => {
    console.log(`Remove all`);
    this.diceKeysByKeyId = {}
  });

  get keyIds(): string[] { return Object.keys(this.diceKeysByKeyId) }

  get keysIdsAndNicknames() {
    return Object.entries(this.diceKeysByKeyId)
      .map( ([keyId, diceKey]) =>
        ({keyId, nickname: DiceKey.nickname(diceKey) })
      );
  }
 
  diceKeyForKeyId = (keyId: string): DiceKey | undefined => {
    const result = this.diceKeysByKeyId[keyId];
    console.log(`${this.objId} ${keyId} ${result} from ${JSON.stringify(toJS(this.diceKeysByKeyId))} `);
    return result;
  }

  constructor() {
    this.diceKeysByKeyId = {};
    makeAutoObservable(this);
    if (isRunningInPreviewMode()) {
      // When running in encrypted mode, we don't want an empty
      // encrypted store to overwrite state we loaded when
      // initializing the preview.
      autoSaveEncrypted(this, "DiceKeyStore");
    }
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
})();
