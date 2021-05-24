import {
  DiceKey
} from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { autoSaveEncrypted } from "../core/AutoSave";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";

export const DiceKeyMemoryStore = new (class DiceKeyMemoryStore {
  protected diceKeysByKeyId: Record<string, DiceKey>;

  addDiceKeyForKeyId = action ( (keyId: string, diceKey: DiceKey) => {
    // console.log(`addDiceKeyForKeyId(${keyId}) ${diceKey}`);
    if (!(keyId in this.diceKeyForKeyId))
      this.diceKeysByKeyId[keyId] = diceKey;
  });

  addDiceKey = async (diceKey: DiceKey) =>
    this.addDiceKeyForKeyId(await diceKey.keyId(), diceKey);

  removeDiceKeyForKeyId = action ( (keyId: string) => {
    // console.log(`removeDiceKeyForKeyId(${keyId})`);
    delete this.diceKeysByKeyId[keyId];
  });

  removeDiceKey = async (diceKeyOrKeyId: DiceKey | string) => {
    const keyId = typeof(diceKeyOrKeyId) === "string" ? diceKeyOrKeyId : await diceKeyOrKeyId.keyId();
    this.removeDiceKeyForKeyId(keyId);
  };

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.diceKeysByKeyId = {}
  });

  get keyIds(): string[] { return Object.keys(this.diceKeysByKeyId) }

  get keysIdsAndNicknames() {
    return Object.entries(this.diceKeysByKeyId)
      .map( ([keyId, diceKey]) =>
        ({keyId, nickname: diceKey.nickname })
      );
  }
 
  diceKeyForKeyId = (keyId: string): DiceKey | undefined => {
    const result = this.diceKeysByKeyId[keyId];
    // console.log(`${keyId} ${result} from ${JSON.stringify(toJS(this.diceKeysByKeyId))} `);
    return result;
  }

  constructor() {
    this.diceKeysByKeyId = {};
    makeAutoObservable(this);
    autoSaveEncrypted(this, "DiceKeyStore", true);
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
})();
