import {
  DiceKey, diceKeyFacesFromHumanReadableForm, DiceKeyInHumanReadableForm, DiceKeyWithKeyId, DiceKeyWithoutKeyId, PublicDiceKeyDescriptor
} from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { autoSaveEncrypted } from "../core/AutoSave";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";
import { CustomEvent } from "../../utilities/event";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { EncryptedDiceKeyStore, sortPublicDiceKeyDescriptors } from "./EncryptedDiceKeyStore";

export interface PublicDiceKeyDescriptorWithSavedOnDevice extends PublicDiceKeyDescriptor {
  savedOnDevice: boolean
};

class DiceKeyMemoryStoreClass {
  #keyIdToDiceKeyInHumanReadableForm: Record<string, DiceKeyInHumanReadableForm>;
  #centerLetterAndDigitToKeyId: Record<string, string>;

  #readyEvent = new CustomEvent(this);
  #isReady = RUNNING_IN_ELECTRON;

  #triggerReadyState = action( () => {
    if (!this.#isReady) {
      this.#isReady = true;
      this.#readyEvent.send()
    }
  });

  onReady = (callback: () => any) => {
    if (this.#isReady) {
      callback();
    } else {
      this.#readyEvent.onOnce( callback );
    }
  }

  addDiceKeyWithKeyId = action ( (diceKey: DiceKeyWithKeyId) => {
    if (!(diceKey.keyId in this.diceKeyForKeyId)) {
      this.#keyIdToDiceKeyInHumanReadableForm[diceKey.keyId] = diceKey.rotateToTurnCenterFaceUpright().inHumanReadableForm;
      // Append the letter/digit to the end of the array (or start a new array)
      if (!(diceKey.centerLetterAndDigit in this.#centerLetterAndDigitToKeyId)) {
        this.#centerLetterAndDigitToKeyId[diceKey.centerLetterAndDigit] = diceKey.keyId;        
      }
    }
  });

  loadFromDeviceStorage = async (...params: Parameters<typeof EncryptedDiceKeyStore.load>) : Promise<DiceKeyWithKeyId | undefined> => {
    if (!RUNNING_IN_ELECTRON)  return;
    const diceKeyWithKeyId = await EncryptedDiceKeyStore.load(...params);
    if (diceKeyWithKeyId != null) {
      this.addDiceKeyWithKeyId(diceKeyWithKeyId);
    }
    return diceKeyWithKeyId;
  }

  addDiceKeyAsync = async (diceKey: DiceKey) => {
    this.addDiceKeyWithKeyId(await diceKey.withKeyId);
  }

  removeDiceKeyForKeyId = action ( (keyId: string) => {
    // console.log(`removeDiceKeyForKeyId(${keyId})`);
    delete this.#keyIdToDiceKeyInHumanReadableForm[keyId];
  });

  removeDiceKey = async (diceKeyOrKeyId: DiceKeyWithKeyId | string) => {
    const keyId = typeof(diceKeyOrKeyId) === "string" ? diceKeyOrKeyId : diceKeyOrKeyId.keyId;
    this.removeDiceKeyForKeyId(keyId);
  };

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.#keyIdToDiceKeyInHumanReadableForm = {}
    this.#centerLetterAndDigitToKeyId = {}
  });

  get keyIds(): string[] { return Object.keys(this.#keyIdToDiceKeyInHumanReadableForm) }

  get keysInMemory(): PublicDiceKeyDescriptorWithSavedOnDevice[] {
    return sortPublicDiceKeyDescriptors(Object.entries(this.#keyIdToDiceKeyInHumanReadableForm).map( ([keyId, diceKeyInHumanReadableForm]) => {
      const {centerFace} = new DiceKeyWithoutKeyId(diceKeyFacesFromHumanReadableForm(diceKeyInHumanReadableForm));
      return {
        keyId,
        centerFaceDigit: centerFace.digit,
        centerFaceLetter: centerFace.letter,
        savedOnDevice: RUNNING_IN_ELECTRON && EncryptedDiceKeyStore.has({keyId})
      }
    }));
  }

  get keysSavedToDeviceButNotInMemory(): (PublicDiceKeyDescriptorWithSavedOnDevice & {savedOnDevice: true})[] {
    return RUNNING_IN_ELECTRON ? (
      EncryptedDiceKeyStore.storedDiceKeys
        // remove keys already in memory
        .filter( ({keyId}) => this.#keyIdToDiceKeyInHumanReadableForm[keyId] == null )
        .map( x => ({...x, savedOnDevice: true}) )
    ) :
      [];
  }

  get keysInMemoryOrSavedToDevice(): PublicDiceKeyDescriptorWithSavedOnDevice[] {
    return Object.entries(this.#keyIdToDiceKeyInHumanReadableForm).map( ([keyId, diceKeyInHumanReadableForm]) => {
      const k = new DiceKeyWithKeyId(keyId, diceKeyFacesFromHumanReadableForm(diceKeyInHumanReadableForm));
      const {centerFace} = k;
      return {
        keyId,
        centerFaceDigit: centerFace.digit,
        centerFaceLetter: centerFace.letter,
        savedOnDevice: RUNNING_IN_ELECTRON && EncryptedDiceKeyStore.has({keyId})
      }
    })
  }

  get isNonEmpty(): boolean { return this.keyIds.length > 0 }

  get keysIdsAndNicknames() {
    return Object.entries(this.#keyIdToDiceKeyInHumanReadableForm)
      .map( ([keyId, diceKeyInHumanReadableForm]) =>
        ({keyId, nickname: DiceKeyWithoutKeyId.fromHumanReadableForm(diceKeyInHumanReadableForm).nickname })
      );
  }
 
  diceKeyForKeyId = (keyId: string | undefined): DiceKeyWithKeyId | undefined => {
    if (keyId == null) return;
    const result = this.#keyIdToDiceKeyInHumanReadableForm[keyId];
    // console.log(`${keyId} ${result} from ${JSON.stringify(toJS(this.diceKeysByKeyId))} `);
    if (typeof result === "string") {
      return new DiceKeyWithKeyId(keyId, diceKeyFacesFromHumanReadableForm(result));
    }
    return;
  }

  keyIdForCenterLetterAndDigit = (centerLetterAndDigit: string): string | undefined =>
    this.#centerLetterAndDigitToKeyId[centerLetterAndDigit];

  constructor() {
    this.#keyIdToDiceKeyInHumanReadableForm = {};
    this.#centerLetterAndDigitToKeyId = {}
    makeAutoObservable(this);
    if (!RUNNING_IN_ELECTRON) {
      // We don't need to save the DiceKeyStore in electron because there is only one window right now
      // and there's no chance of a refresh.
      autoSaveEncrypted(this, "DiceKeyStore", this.#triggerReadyState, true);
    }
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
}
export const DiceKeyMemoryStore = new DiceKeyMemoryStoreClass();