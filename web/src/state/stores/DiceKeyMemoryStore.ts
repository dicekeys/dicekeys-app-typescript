import {
  DiceKey, diceKeyFacesFromHumanReadableForm, DiceKeyInHumanReadableForm, DiceKeyWithKeyId, DiceKeyWithoutKeyId
} from "../../dicekeys/DiceKey";
import { action, makeAutoObservable, runInAction } from "mobx";
import { autoSaveEncrypted } from "../core/AutoSave";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";
import { CustomEvent } from "../../utilities/event";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";

const readyEvent = new CustomEvent(this);
let isReady = false;

class DiceKeyMemoryStoreClass {
  protected keyIdToDiceKeyInHumanReadableForm: Record<string, DiceKeyInHumanReadableForm>;
  protected centerLetterAndDigitToKeyId: Record<string, string>;

  onReady = (callback: () => any) => {
    if (isReady) {
      callback();
    } else {
      readyEvent.onOnce( callback );
    }
  }

  addDiceKeyWithKeyId = action ( (diceKey: DiceKeyWithKeyId) => {
    if (!(diceKey.keyId in this.diceKeyForKeyId)) {
      this.keyIdToDiceKeyInHumanReadableForm[diceKey.keyId] = diceKey.rotateToTurnCenterFaceUpright().inHumanReadableForm;
      // Append the letter/digit to the end of the array (or start a new array)
      if (!(diceKey.centerLetterAndDigit in this.centerLetterAndDigitToKeyId)) {
        this.centerLetterAndDigitToKeyId[diceKey.centerLetterAndDigit] = diceKey.keyId;        
      }
    }
  });

  addDiceKey = async (diceKey: DiceKey) => {
    this.addDiceKeyWithKeyId(await diceKey.withKeyId);
  }

  removeDiceKeyForKeyId = action ( (keyId: string) => {
    // console.log(`removeDiceKeyForKeyId(${keyId})`);
    delete this.keyIdToDiceKeyInHumanReadableForm[keyId];
  });

  removeDiceKey = async (diceKeyOrKeyId: DiceKeyWithKeyId | string) => {
    const keyId = typeof(diceKeyOrKeyId) === "string" ? diceKeyOrKeyId : diceKeyOrKeyId.keyId;
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
        ({keyId, nickname: DiceKeyWithoutKeyId.fromHumanReadableForm(diceKeyInHumanReadableForm).nickname })
      );
  }
 
  diceKeyForKeyId = (keyId: string | undefined): DiceKeyWithKeyId | undefined => {
    if (keyId == null) return;
    const result = this.keyIdToDiceKeyInHumanReadableForm[keyId];
    // console.log(`${keyId} ${result} from ${JSON.stringify(toJS(this.diceKeysByKeyId))} `);
    if (typeof result === "string") {
      return new DiceKeyWithKeyId(keyId, diceKeyFacesFromHumanReadableForm(result));
    }
    return;
  }

  keyIdForCenterLetterAndDigit = (centerLetterAndDigit: string): string | undefined =>
    this.centerLetterAndDigitToKeyId[centerLetterAndDigit];

  constructor() {
    this.keyIdToDiceKeyInHumanReadableForm = {};
    this.centerLetterAndDigitToKeyId = {}
    makeAutoObservable(this);
    if (RUNNING_IN_ELECTRON) {
      // We don't need to save the DiceKeyStore in electron because there is only one window right now
      // and there's no chance of a refresh.
      isReady = true; readyEvent.send();
    } else {
      autoSaveEncrypted(this, "DiceKeyStore", () => runInAction( () => { isReady = true; readyEvent.send();} ), true);
    }
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
}
export const DiceKeyMemoryStore = new DiceKeyMemoryStoreClass();