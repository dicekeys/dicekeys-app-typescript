import {
  diceKeyFacesFromHumanReadableForm, DiceKeyInHumanReadableForm, DiceKeyWithKeyId, DiceKeyWithoutKeyId, PublicDiceKeyDescriptor
} from "../../dicekeys/DiceKey";
import { action, makeAutoObservable, ObservableMap} from "mobx";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";
import { CustomEvent } from "../../utilities/event";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { EncryptedDiceKeyStore, sortPublicDiceKeyDescriptors } from "./EncryptedDiceKeyStore";
import { writeStringToEncryptedLocalStorageField, readStringFromEncryptedLocalStorageField } from "../core/EncryptedStorageFields";
import type { FaceOrientationLetterTrbl } from "@dicekeys/read-dicekey-js";

export interface PublicDiceKeyDescriptorWithSavedOnDevice extends PublicDiceKeyDescriptor {
  savedOnDevice: boolean
};

export const PlatformSupportsSavingToDevice = RUNNING_IN_ELECTRON;

interface StorageFormat {
  keyIdToDiceKeyInHumanReadableForm: [string, DiceKeyInHumanReadableForm][];
//  centerLetterAndDigitToKeyId: [string, string][];
}

const msDelayBeforeStart = 250;
const msToRotate = 2500;
const msTotalForRotation = msDelayBeforeStart + msToRotate;

const getRotationParameters = (centerFaceOrientationToRotateFromRbl: Exclude<FaceOrientationLetterTrbl, "t">) => ({
  rotationDelayTimeInSeconds: msDelayBeforeStart/1000,
  rotationTimeInSeconds: msToRotate/1000,
  centerFaceOrientationToRotateFrom: centerFaceOrientationToRotateFromRbl,
});

class DiceKeyMemoryStoreClass {
  static readonly StorageFieldName = "DiceKeyStore";
  // Because this class is saved using autoSaveEncrypted, all
  // files must be exposed (no private # fields) and must be 
  // classic JavaScript objects (no maps or observable maps)
  private keyIdToDiceKeyInHumanReadableForm = new ObservableMap<string, DiceKeyInHumanReadableForm>();
  private centerLetterAndDigitToKeyId = new ObservableMap<string, string>();
  private keyIdToCenterFaceOrientationWhenScanned = new ObservableMap<string, FaceOrientationLetterTrbl>();

  getRotationParametersForKeyId = (keyId: string): ReturnType<typeof getRotationParameters> | undefined => {
    const centerFaceOrientationWhenScanned = this.keyIdToCenterFaceOrientationWhenScanned.get(keyId);
    if (centerFaceOrientationWhenScanned != null && centerFaceOrientationWhenScanned != "t") {
      return getRotationParameters(centerFaceOrientationWhenScanned);
    }
    return;
  }

  #readyEvent = new CustomEvent(this);
  #isReady = RUNNING_IN_ELECTRON;

  #triggerReadyState = action( () => {
    if (!this.#isReady) {
      this.#isReady = true;
      // console.log(`DiceKeyMemoryStoreClass ready`);
      this.#readyEvent.sendImmediately()
    }
  });

  onReady = (callback: () => void) => {
    if (this.#isReady) {
      // console.log(`onReady called when already ready`);
      callback();
    } else {
      this.#readyEvent.onOnce( callback );
    }
  }

  toStorageFormat = (): StorageFormat => ({
    keyIdToDiceKeyInHumanReadableForm: [...this.keyIdToDiceKeyInHumanReadableForm.entries()],
//    centerLetterAndDigitToKeyId: [...this.centerLetterAndDigitToKeyId.entries()]
  });
  toStorageFormatJson = () => JSON.stringify(this.toStorageFormat())

  updateStorage = () => {
    if (!RUNNING_IN_ELECTRON) {
      writeStringToEncryptedLocalStorageField(DiceKeyMemoryStoreClass.StorageFieldName, this.toStorageFormatJson());
    }
  }

  onReadFromShortTermEncryptedStorage = action ( (s: StorageFormat) => {
    this.keyIdToDiceKeyInHumanReadableForm = new ObservableMap(s.keyIdToDiceKeyInHumanReadableForm);
    this.centerLetterAndDigitToKeyId = new ObservableMap(
      s.keyIdToDiceKeyInHumanReadableForm.map( ([keyId, diceKeyInHumanReadableForm]) =>
        ([DiceKeyWithoutKeyId.fromHumanReadableForm(diceKeyInHumanReadableForm).centerLetterAndDigit, keyId])
    ));
  });

  /**
   * Adds a DiceKey to the memory store, ensuring that it is rotated so that the middle face is upright.
   * It returns the DiceKey with the middle face upright.
   */
  addDiceKeyWithKeyId = action ( (diceKey: DiceKeyWithKeyId, centerFaceOrientationWhenScanned?: FaceOrientationLetterTrbl): DiceKeyWithKeyId => {
    const diceKeyWithCenterFaceUpright = diceKey.rotateToTurnCenterFaceUpright();
    if (this.diceKeyForKeyId(diceKeyWithCenterFaceUpright.keyId) == null) {
      this.keyIdToDiceKeyInHumanReadableForm.set(diceKeyWithCenterFaceUpright.keyId, diceKeyWithCenterFaceUpright.inHumanReadableForm);
      if (centerFaceOrientationWhenScanned != null) {
        this.keyIdToCenterFaceOrientationWhenScanned.set(diceKeyWithCenterFaceUpright.keyId, centerFaceOrientationWhenScanned);
        setTimeout(action(() => {
          this.keyIdToCenterFaceOrientationWhenScanned.delete(diceKeyWithCenterFaceUpright.keyId);
        }), msTotalForRotation);  
      }
      // Append the letter/digit to the end of the array (or start a new array)
      if (!(diceKeyWithCenterFaceUpright.centerLetterAndDigit in this.centerLetterAndDigitToKeyId)) {
        this.centerLetterAndDigitToKeyId.set(diceKeyWithCenterFaceUpright.centerLetterAndDigit, diceKeyWithCenterFaceUpright.keyId);
      }
    }
    this.updateStorage();
    return diceKeyWithCenterFaceUpright;
  });

  private loadFromDeviceStorage = async (...params: Parameters<typeof EncryptedDiceKeyStore.load>) : Promise<DiceKeyWithKeyId | undefined> => {
    if (!RUNNING_IN_ELECTRON)  return;
    const diceKeyWithKeyId = await EncryptedDiceKeyStore.load(...params);
    if (diceKeyWithKeyId != null && !this.keyIdToDiceKeyInHumanReadableForm.has(diceKeyWithKeyId.keyId)) {
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
  load = async (descriptor: {keyId: string}): Promise<DiceKeyWithKeyId | undefined> => {
    const {keyId} = descriptor;
    const keyAlreadyInMemory = this.diceKeyForKeyId(keyId);
    if (keyAlreadyInMemory != null) return keyAlreadyInMemory;
    const diceKeyInHumanReadableForm = this.keyIdToDiceKeyInHumanReadableForm.get(keyId);
    if (diceKeyInHumanReadableForm != null) {
      return new DiceKeyWithKeyId(keyId, diceKeyFacesFromHumanReadableForm(diceKeyInHumanReadableForm));
    } else if (RUNNING_IN_ELECTRON /* && savedOnDevice */) {
      return await this.loadFromDeviceStorage(descriptor);
    }
    return;
  }

  addDiceKeyAsync = async (diceKey: DiceKeyWithoutKeyId, centerFaceOrientationWhenScanned: FaceOrientationLetterTrbl = diceKey.faces[12].orientationAsLowercaseLetterTrbl): Promise<DiceKeyWithKeyId> => {
    return this.addDiceKeyWithKeyId(await diceKey.withKeyId, centerFaceOrientationWhenScanned);
  }

  saveToDeviceStorage = async (diceKey: DiceKeyWithKeyId) => {
    if (RUNNING_IN_ELECTRON) {
      await EncryptedDiceKeyStore.add(diceKey)
    }
  }

  removeDiceKey = action ( ({keyId, centerLetterAndDigit}: PublicDiceKeyDescriptor) => {
    // console.log(`removeDiceKeyForKeyId(${keyId})`);
    this.keyIdToDiceKeyInHumanReadableForm.delete(keyId);
    if (this.centerLetterAndDigitToKeyId.get(centerLetterAndDigit) === keyId) {
      this.centerLetterAndDigitToKeyId.delete(centerLetterAndDigit)
    }
    this.updateStorage();
  });

  deleteFromDeviceStorageAndMemory = (diceKeyWithKeyId: PublicDiceKeyDescriptor) => {
    this.removeDiceKey(diceKeyWithKeyId)
    EncryptedDiceKeyStore.delete(diceKeyWithKeyId)
  }

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.keyIdToDiceKeyInHumanReadableForm.clear();
    this.centerLetterAndDigitToKeyId.clear();
    this.updateStorage();
  });

  get keyIds(): string[] { return [...this.keyIdToDiceKeyInHumanReadableForm.keys()] }

  hasKeyIdInMemory = (keyId: string) => this.keyIdToDiceKeyInHumanReadableForm.has(keyId);

  hasKeyInEncryptedStore = (keyId: string) => EncryptedDiceKeyStore.has({keyId});

  get keysInMemory(): PublicDiceKeyDescriptorWithSavedOnDevice[] {
    return sortPublicDiceKeyDescriptors([...(this.keyIdToDiceKeyInHumanReadableForm.entries())].map( ([keyId, diceKeyInHumanReadableForm]) => {
      const {centerLetterAndDigit} = new DiceKeyWithoutKeyId(diceKeyFacesFromHumanReadableForm(diceKeyInHumanReadableForm));
      return {
        keyId,
        centerLetterAndDigit,
        savedOnDevice: RUNNING_IN_ELECTRON && EncryptedDiceKeyStore.has({keyId})
      }
    }));
  }

  get keysOnlyInMemory(): PublicDiceKeyDescriptorWithSavedOnDevice[] {
    return this.keysInMemory.filter( k => !k.savedOnDevice );
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
    return [...this.keysInMemory, ...this.keysSavedToDeviceButNotInMemory];
  }

  get keysInMemoryOrSavedToDeviceSortedByCenterDie(): PublicDiceKeyDescriptorWithSavedOnDevice[] {
    return sortPublicDiceKeyDescriptors(this.keysInMemoryOrSavedToDevice);
  }

  get isNonEmpty(): boolean { return this.keyIds.length > 0 }

  get keysIdsAndNicknames() {
    return [...this.keyIdToDiceKeyInHumanReadableForm.entries()]
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
    this.centerLetterAndDigitToKeyId.get(centerLetterAndDigit);

  #initiateReadFromLocalStorage = async () => {
    try {
      const json = await readStringFromEncryptedLocalStorageField(DiceKeyMemoryStoreClass.StorageFieldName);
      if (json == null) {
        console.log("No DiceKeys in memory store");
      } else if (json) {
        // console.log(`DiceKeysMemoryStore json`, json);
        const storageFormat = JSON.parse(json) as StorageFormat;
        this.onReadFromShortTermEncryptedStorage(storageFormat);
        // console.log(`Read ${storageFormat.keyIdToDiceKeyInHumanReadableForm.length} DiceKey(s) from memory`)
      }
    } catch {
      console.log("Problem reading DiceKeys from memory store");
    }
    this.#triggerReadyState();
  }

  constructor() {
    makeAutoObservable(this);
    if (!RUNNING_IN_ELECTRON) {
      // We don't need to save the DiceKeyStore in electron because there is only one window right now
      // and there's no chance of a refresh.
      this.#initiateReadFromLocalStorage();
    }
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      this.removeAll();
    })
  }
}
export const DiceKeyMemoryStore = new DiceKeyMemoryStoreClass();