import {
  DiceKey, diceKeyFacesFromHumanReadableForm, DiceKeyInHumanReadableForm, DiceKeyWithKeyId, DiceKeyWithoutKeyId, PublicDiceKeyDescriptor
} from "../../dicekeys/DiceKey";
import { action, makeAutoObservable, ObservableMap } from "mobx";
import { autoSaveEncrypted } from "../core/AutoSave";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";
import { CustomEvent } from "../../utilities/event";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { EncryptedDiceKeyStore, sortPublicDiceKeyDescriptors } from "./EncryptedDiceKeyStore";

export interface PublicDiceKeyDescriptorWithSavedOnDevice extends PublicDiceKeyDescriptor {
  savedOnDevice: boolean
};

class DiceKeyMemoryStoreClass {
  private keyIdToDiceKeyInHumanReadableForm: ObservableMap<string, DiceKeyInHumanReadableForm>;
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
      this.keyIdToDiceKeyInHumanReadableForm.set(diceKey.keyId, diceKey.rotateToTurnCenterFaceUpright().inHumanReadableForm);
      // Append the letter/digit to the end of the array (or start a new array)
      if (!(diceKey.centerLetterAndDigit in this.#centerLetterAndDigitToKeyId)) {
        this.#centerLetterAndDigitToKeyId[diceKey.centerLetterAndDigit] = diceKey.keyId;        
      }
    }
  });

  private loadFromDeviceStorage = async (...params: Parameters<typeof EncryptedDiceKeyStore.load>) : Promise<DiceKeyWithKeyId | undefined> => {
    if (!RUNNING_IN_ELECTRON)  return;
    const diceKeyWithKeyId = await EncryptedDiceKeyStore.load(...params);
    if (diceKeyWithKeyId != null && this.keyIdToDiceKeyInHumanReadableForm.has(diceKeyWithKeyId.keyId)) {
      // This DiceKey was not in the memory store, and should be added.
      this.addDiceKeyWithKeyId(diceKeyWithKeyId);
    }
    return diceKeyWithKeyId;
  }

  /**
   * Load a DiceKey either from memory (all platforms) or long-term storage
   * (Electron)
   * 
   * @param descriptor A public descriptor storing a DiceKey
   * @returns 
   */
  load = async (descriptor: PublicDiceKeyDescriptorWithSavedOnDevice): Promise<DiceKeyWithKeyId | undefined> => {
    const {keyId, savedOnDevice} = descriptor;
    const diceKeyInHumanReadableForm = this.keyIdToDiceKeyInHumanReadableForm.get(keyId);
    if (diceKeyInHumanReadableForm != null) {
      return new DiceKeyWithKeyId(keyId, diceKeyFacesFromHumanReadableForm(diceKeyInHumanReadableForm));
    } else if (savedOnDevice) {
      return await this.loadFromDeviceStorage(descriptor);
    }
    return;
  }

  addDiceKeyAsync = async (diceKey: DiceKey) => {
    this.addDiceKeyWithKeyId(await diceKey.withKeyId);
  }

  saveToDeviceStorage = async (diceKey: DiceKeyWithKeyId) => {
    if (RUNNING_IN_ELECTRON) {
      await EncryptedDiceKeyStore.add(diceKey)
    }
  }

  removeDiceKeyForKeyId = action ( (keyId: string) => {
    // console.log(`removeDiceKeyForKeyId(${keyId})`);
    this.keyIdToDiceKeyInHumanReadableForm.delete(keyId);
  });

  removeDiceKey = async (diceKeyOrKeyId: DiceKeyWithKeyId | string) => {
    const keyId = typeof(diceKeyOrKeyId) === "string" ? diceKeyOrKeyId : diceKeyOrKeyId.keyId;
    this.removeDiceKeyForKeyId(keyId);
  };

  deleteKeyIdFromDeviceStorageAndMemory = (keyId: string) => {
    this.removeDiceKeyForKeyId(keyId)
    EncryptedDiceKeyStore.delete({keyId})
  }

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.keyIdToDiceKeyInHumanReadableForm.clear();
    this.#centerLetterAndDigitToKeyId = {}
  });

  get keyIds(): string[] { return Object.keys(this.keyIdToDiceKeyInHumanReadableForm) }

  get keysInMemory(): PublicDiceKeyDescriptorWithSavedOnDevice[] {
    return sortPublicDiceKeyDescriptors(Object.entries(this.keyIdToDiceKeyInHumanReadableForm).map( ([keyId, diceKeyInHumanReadableForm]) => {
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
        .filter( ({keyId}) => !this.keyIdToDiceKeyInHumanReadableForm.has(keyId) )
        // augment record to indicate these keys are saved on the device
        .map( x => ({...x, savedOnDevice: true}) )
    ) :
      [];
  }

  get keysInMemoryOrSavedToDevice(): PublicDiceKeyDescriptorWithSavedOnDevice[] {
    return [...this.keyIdToDiceKeyInHumanReadableForm.entries()].map( ([keyId, diceKeyInHumanReadableForm]) => {
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
    return Object.entries(this.keyIdToDiceKeyInHumanReadableForm)
      .map( ([keyId, diceKeyInHumanReadableForm]) =>
        ({keyId, nickname: DiceKeyWithoutKeyId.fromHumanReadableForm(diceKeyInHumanReadableForm).nickname })
      );
  }
 
  diceKeyForKeyId = (keyId: string | undefined): DiceKeyWithKeyId | undefined => {
    if (keyId == null) return;
    const result = this.keyIdToDiceKeyInHumanReadableForm.get(keyId);
    // console.log(`${keyId} ${result} from ${JSON.stringify(toJS(this.diceKeysByKeyId))} `);
    if (typeof result === "string") {
      return new DiceKeyWithKeyId(keyId, diceKeyFacesFromHumanReadableForm(result));
    }
    return;
  }

  keyIdForCenterLetterAndDigit = (centerLetterAndDigit: string): string | undefined =>
    this.#centerLetterAndDigitToKeyId[centerLetterAndDigit];

  constructor() {
    this.keyIdToDiceKeyInHumanReadableForm = new ObservableMap();
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