import {
  DiceKey, DiceKeyInHumanReadableForm
} from "../../dicekeys/DiceKey";
import { action, makeAutoObservable, runInAction } from "mobx";
import { autoSaveEncrypted } from "../core/AutoSave";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";
import { CustomEvent } from "../../utilities/event";

const readyEvent = new CustomEvent(this);
let isReady = false;

export const DiceKeyMemoryStore = new (class DiceKeyMemoryStore {
  protected keyIdToDiceKeyInHumanReadableForm: Record<string, DiceKeyInHumanReadableForm>;
  protected centerLetterAndDigitToKeyId: Record<string, string>;

  onReady = (callback: () => any) => {
    if (isReady) {
      callback();
    } else {
      readyEvent.onOnce( callback );
    }
  }

  addDiceKeyForKeyId = action ( (keyId: string, diceKey: DiceKey) => {
    // console.log(`addDiceKeyForKeyId(${keyId}) ${diceKey}`);
    if (!(keyId in this.diceKeyForKeyId)) {
      this.keyIdToDiceKeyInHumanReadableForm[keyId] = diceKey.inHumanReadableForm;
      // Append the letter/digit to the end of the array (or start a new array)
      if (!(diceKey.centerLetterAndDigit in this.centerLetterAndDigitToKeyId)) {
        this.centerLetterAndDigitToKeyId[diceKey.centerLetterAndDigit] = keyId;        
      }
      // this.centerLetterAndDigitToKeyId[diceKey.centerLetterAndDigit] =
      //   [...(this.centerLetterAndDigitToKeyId[diceKey.centerLetterAndDigit] ?? []), keyId];
    }
  });

  addDiceKey = async (diceKey: DiceKey) =>
    this.addDiceKeyForKeyId(await diceKey.keyId(), diceKey);

  removeDiceKeyForKeyId = action ( (keyId: string) => {
    // console.log(`removeDiceKeyForKeyId(${keyId})`);
    delete this.keyIdToDiceKeyInHumanReadableForm[keyId];
  });

  removeDiceKey = async (diceKeyOrKeyId: DiceKey | string) => {
    const keyId = typeof(diceKeyOrKeyId) === "string" ? diceKeyOrKeyId : await diceKeyOrKeyId.keyId();
    this.removeDiceKeyForKeyId(keyId);
  };

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.keyIdToDiceKeyInHumanReadableForm = {}
    this.centerLetterAndDigitToKeyId = {}
  });

  get keyIds(): string[] { return Object.keys(this.keyIdToDiceKeyInHumanReadableForm) }

  get keysIdsAndNicknames() {
    return Object.entries(this.keyIdToDiceKeyInHumanReadableForm)
      .map( ([keyId, diceKeyInHumanReadableForm]) =>
        ({keyId, nickname: DiceKey.fromHumanReadableForm(diceKeyInHumanReadableForm).nickname })
      );
  }
 
  diceKeyForKeyId = (keyId: string | undefined): DiceKey | undefined => {
    if (keyId == null) return;
    const result = this.keyIdToDiceKeyInHumanReadableForm[keyId];
    // console.log(`${keyId} ${result} from ${JSON.stringify(toJS(this.diceKeysByKeyId))} `);
    if (typeof result === "string") {
      return DiceKey.fromHumanReadableForm(result);
    }
    return;
  }

  keyIdForCenterLetterAndDigit = (centerLetterAndDigit: string): string | undefined =>
    this.centerLetterAndDigitToKeyId[centerLetterAndDigit];

  constructor() {
    this.keyIdToDiceKeyInHumanReadableForm = {};
    this.centerLetterAndDigitToKeyId = {}
    makeAutoObservable(this);
    autoSaveEncrypted(this, "DiceKeyStore", () => runInAction( () => { isReady = true; readyEvent.send();} ), true);
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
})();
