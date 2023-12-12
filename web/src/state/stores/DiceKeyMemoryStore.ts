import { ObservableMap, action, autorun, makeAutoObservable, runInAction } from "mobx";
import type { DiceKeyMemoryStoreStorageFormat } from "../../../../common/IElectronBridge";
import type { DiceKey, FaceLetterAndDigit, FaceOrientationLetterTrbl } from "../../dicekeys/DiceKey";
import {
  DiceKeyInHumanReadableForm,
  DiceKeyWithKeyId, DiceKeyWithoutKeyId, PublicDiceKeyDescriptor,
  diceKeyFacesFromHumanReadableForm
} from "../../dicekeys/DiceKey";
import { CustomEvent } from "../../utilities/event";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { jsonStringifyWithSortedFieldOrder } from "../../utilities/json";
import { AllAppWindowsAndTabsAreClosingEvent } from "../core/AllAppWindowsAndTabsAreClosingEvent";
import { eraseFromLocalStorageAndMoveToSessionStorageForRefresh, readStringFromEncryptedLocalStorageField, writeStringToEncryptedLocalStorageField } from "../core/EncryptedStorageFields";
import { EncryptedDiceKeyStore, sortPublicDiceKeyDescriptors } from "./EncryptedDiceKeyStore";
import { SynchronizedString } from "./SynchronizedStringStore";

export interface PublicDiceKeyDescriptorWithSavedOnDevice extends PublicDiceKeyDescriptor {
  savedOnDevice: boolean
}


const SynchronizedStorageFormat = RUNNING_IN_ELECTRON ? new class {
  synchronizedString = SynchronizedString.forKey('DiceKeyMemoryStore');
  get json() { return this.synchronizedString.stringValue }
  get storageFormat(): DiceKeyMemoryStoreStorageFormat {
    const json = this.json;
    return (json == null) ? {keyIdToDiceKeyInHumanReadableForm: []} :
      JSON.parse(json) as DiceKeyMemoryStoreStorageFormat;
  }
  set storageFormat(value: DiceKeyMemoryStoreStorageFormat | undefined) {
    // console.log(`set storageFormat("${value}")`);
    this.synchronizedString.setStringValue(value == null ? value : jsonStringifyWithSortedFieldOrder(value))
  }
}() : undefined;

export const PlatformSupportsSavingToDevice = RUNNING_IN_ELECTRON;

const msDelayBeforeStart = 250;
const msToRotate = 2500;
const msTotalForRotation = msDelayBeforeStart + msToRotate;

const getRotationParameters = (centerFaceOrientationToRotateFromRbl: Exclude<FaceOrientationLetterTrbl, "t">) => ({
  $rotationDelayTimeInSeconds: msDelayBeforeStart/1000,
  $rotationTimeInSeconds: msToRotate/1000,
  $centerFaceOrientationToRotateFrom: centerFaceOrientationToRotateFromRbl,
});

class DiceKeyMemoryStoreClass {
  static readonly StorageFieldName = "DiceKeyStore";
  // These object are converted to raw form before saving
  private keyIdToDiceKeyInHumanReadableForm = new ObservableMap<string, DiceKeyInHumanReadableForm>();

  // Reconstituted across processes from keyIdToDiceKeyInHumanReadableForm
  private centerLetterAndDigitToKeyId = new ObservableMap<string, string>();
  // Not saved across processes
  private centerLetterAndDigitToOrientationWhenScanned = new ObservableMap<FaceLetterAndDigit, FaceOrientationLetterTrbl>();

  getRotationParametersForCenterLetterAndDigit = (centerLetterAndDigit: FaceLetterAndDigit): ReturnType<typeof getRotationParameters> | undefined => {
    const centerFaceOrientationWhenScanned = this.centerLetterAndDigitToOrientationWhenScanned.get(centerLetterAndDigit);
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

  toStorageFormat = (): DiceKeyMemoryStoreStorageFormat => ({
    keyIdToDiceKeyInHumanReadableForm: [...this.keyIdToDiceKeyInHumanReadableForm.entries()],
//    centerLetterAndDigitToKeyId: [...this.centerLetterAndDigitToKeyId.entries()]
  });
  toStorageFormatJson = () => JSON.stringify(this.toStorageFormat())

  updateStorage = () => {
    if (SynchronizedStorageFormat) {
      // Broadcast to all windows main process
      // console.log(`updateStorage()`);
      SynchronizedStorageFormat.storageFormat = this.toStorageFormat();
    } else {
      // Running in the browser
      writeStringToEncryptedLocalStorageField(DiceKeyMemoryStoreClass.StorageFieldName, this.toStorageFormatJson());
    }
  }

  updateFromSharedStorage = action ( (s: DiceKeyMemoryStoreStorageFormat) => {
    this.keyIdToDiceKeyInHumanReadableForm.replace(s.keyIdToDiceKeyInHumanReadableForm);
    this.centerLetterAndDigitToKeyId.replace(
      s.keyIdToDiceKeyInHumanReadableForm.map( ([keyId, diceKeyInHumanReadableForm]) =>
        ([DiceKeyWithoutKeyId.fromHumanReadableForm(diceKeyInHumanReadableForm).centerLetterAndDigit, keyId])
    ));
  });

  addCenterFaceOrientationWhenScanned = async (diceKey: DiceKey, centerFaceOrientationWhenScannedTrbl: FaceOrientationLetterTrbl = diceKey.centerFace.orientationAsLowercaseLetterTrbl) => {
    this.centerLetterAndDigitToOrientationWhenScanned.set(diceKey.centerLetterAndDigit, centerFaceOrientationWhenScannedTrbl);
    setTimeout(action(() => {
      this.centerLetterAndDigitToOrientationWhenScanned.delete(diceKey.centerLetterAndDigit);
    }), msTotalForRotation);  
  }

  addDiceKeyWithKeyIdWithoutUpdatingSharedStorage = action ( (diceKey: DiceKeyWithKeyId): DiceKeyWithKeyId => {
    const diceKeyWithCenterFaceUpright = diceKey.rotateToTurnCenterFaceUpright();
    if (this.diceKeyForKeyId(diceKey.keyId) == null) {
      this.keyIdToDiceKeyInHumanReadableForm.set(diceKeyWithCenterFaceUpright.keyId, diceKeyWithCenterFaceUpright.inHumanReadableForm);
      if (!(diceKeyWithCenterFaceUpright.centerLetterAndDigit in this.centerLetterAndDigitToKeyId)) {
        this.centerLetterAndDigitToKeyId.set(diceKeyWithCenterFaceUpright.centerLetterAndDigit, diceKeyWithCenterFaceUpright.keyId);
      }
    }
    return diceKeyWithCenterFaceUpright;
  });

  /**
   * Adds a DiceKey to the memory store, ensuring that it is rotated so that the middle face is upright.
   * It returns the DiceKey with the middle face upright.
   */
  addDiceKeyWithKeyId = (diceKeyWithKeyId: DiceKeyWithKeyId): DiceKeyWithKeyId => {
    const diceKeyWithCenterFaceUpright = this.addDiceKeyWithKeyIdWithoutUpdatingSharedStorage(diceKeyWithKeyId);
    this.updateStorage();
    return diceKeyWithCenterFaceUpright;
  };


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

  addDiceKeyAsync = async (diceKey: DiceKeyWithoutKeyId): Promise<DiceKeyWithKeyId> => {
    return this.addDiceKeyWithKeyId(await diceKey.withKeyId);
  }

  saveToDeviceStorage = async (diceKey: DiceKey) => {
    if (RUNNING_IN_ELECTRON) {
      await EncryptedDiceKeyStore.add(diceKey)
    }
  }

  removeDiceKey = async ({keyId: keyIdOrPromise, centerLetterAndDigit}: {keyId: string | Promise<string>, centerLetterAndDigit: string}) => {
    const keyId = await keyIdOrPromise;
    runInAction( () => {
      this.keyIdToDiceKeyInHumanReadableForm.delete(keyId);
      if (this.centerLetterAndDigitToKeyId.get(centerLetterAndDigit) === keyId) {
        this.centerLetterAndDigitToKeyId.delete(centerLetterAndDigit)
      }  
    })
    this.updateStorage();
  }

  deleteFromDeviceStorageAndMemory = (diceKey: DiceKey) => {
    this.removeDiceKey(diceKey)
    EncryptedDiceKeyStore.delete(diceKey)
  }

  removeAll = action ( () => {
    // console.log(`Remove all`);
    this.keyIdToDiceKeyInHumanReadableForm.clear();
    this.centerLetterAndDigitToKeyId.clear();
    this.centerLetterAndDigitToOrientationWhenScanned.clear();
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

  #fetchFromLocalStorageField = async (): Promise<DiceKeyMemoryStoreStorageFormat | undefined> => {
    try {
      const json = await readStringFromEncryptedLocalStorageField(DiceKeyMemoryStoreClass.StorageFieldName);
      if (json == null) {
        console.log("No DiceKeys in memory store");
      } else if (json) {
        // console.log(`DiceKeysMemoryStore json`, json);
        const storageFormat = JSON.parse(json) as DiceKeyMemoryStoreStorageFormat;
        return storageFormat;
      }
    } catch {
      console.log("Problem reading DiceKeys from memory store");
    }
    return;
  }

  #initiateReadFromLocalStorage = async () => {
    try {
      const storageFormat = SynchronizedStorageFormat ?
        SynchronizedStorageFormat.storageFormat :
        await this.#fetchFromLocalStorageField();
      if (storageFormat != null) {
        this.updateFromSharedStorage(storageFormat);
      }
    } catch {
      console.log("Problem reading DiceKeys from memory store");
    }
    this.#triggerReadyState();
  }

  constructor() {
    makeAutoObservable(this);
    this.#initiateReadFromLocalStorage();
    if (SynchronizedStorageFormat) {
      autorun( () => {
        this.updateFromSharedStorage( SynchronizedStorageFormat.storageFormat );
      })
    }
    
    AllAppWindowsAndTabsAreClosingEvent.on( () => {
      // Empty the store if all app windows are closing.
      eraseFromLocalStorageAndMoveToSessionStorageForRefresh(DiceKeyMemoryStoreClass.StorageFieldName);
    })
  }
}
export const DiceKeyMemoryStore = new DiceKeyMemoryStoreClass();