import { action, makeAutoObservable } from "mobx";
import { autoSave } from "../core/AutoSave";
import type {IElectronBridge} from "../../../../common/IElectronBridge";
import {DiceKey, DiceKeyInHumanReadableForm, DiceKeyWithKeyId, PublicDiceKeyDescriptor} from "../../dicekeys/DiceKey";

const electronBridge = (window as unknown as  {ElectronBridge: IElectronBridge}).ElectronBridge;

/**
 * Sort PublicDiceKeyDescriptors first by letter, then digit, then keyId.
 * @param descriptors
 * @returns 
 */
const sortPublicDiceKeyDescriptors = (descriptors: PublicDiceKeyDescriptor[]): PublicDiceKeyDescriptor[] =>
  descriptors.sort( (a, b) =>
    `${a.centerFaceLetter}${a.centerFaceDigit}${a.keyId}`.localeCompare(`${b.centerFaceLetter}${b.centerFaceDigit}${b.keyId}`)
);

const removePublicKeyDescriptor = (descriptors: PublicDiceKeyDescriptor[], toRemove: {keyId: string} | PublicDiceKeyDescriptor) =>
    descriptors.filter( ({keyId}) => keyId != toRemove.keyId );

class EncryptedDiceKeyStoreClass {
  protected _publicDescriptorsOfEncryptedDiceKeys: PublicDiceKeyDescriptor[];
  protected get publicDescriptorsOfEncryptedDiceKeys(): PublicDiceKeyDescriptor[] {
    return this._publicDescriptorsOfEncryptedDiceKeys;
  }

  protected setPublicDescriptorsOfEncryptedDiceKeys = action( (publicDescriptorsOfEncryptedDiceKeys: PublicDiceKeyDescriptor[]) => {
    this._publicDescriptorsOfEncryptedDiceKeys = sortPublicDiceKeyDescriptors(publicDescriptorsOfEncryptedDiceKeys);
  });

  has = ({keyId}: {keyId: string} | PublicDiceKeyDescriptor) => this.publicDescriptorsOfEncryptedDiceKeys.some(
    descriptor => keyId === descriptor.keyId
  );

  add = async (diceKey: DiceKeyWithKeyId) => {
    const keyId = diceKey.keyId;
    await electronBridge.storeDiceKeyInCredentialStore(keyId, diceKey.inHumanReadableForm);
    this.setPublicDescriptorsOfEncryptedDiceKeys([
      ...removePublicKeyDescriptor(this.publicDescriptorsOfEncryptedDiceKeys, {keyId}),
      {keyId, centerFaceLetter: diceKey.centerFace.letter, centerFaceDigit: diceKey.centerFace.digit}
    ]);
  };

  load = async ({keyId}: {keyId: string} | PublicDiceKeyDescriptor): Promise<DiceKey | undefined> => {
    try {
      const diceKeyInHumanReadableForm = await electronBridge.getDiceKeyFromCredentialStore(keyId);
      if (diceKeyInHumanReadableForm != null && diceKeyInHumanReadableForm.length === 75) {
        return await DiceKeyWithKeyId.fromHumanReadableForm(diceKeyInHumanReadableForm as DiceKeyInHumanReadableForm);
      }
      // They key is not actually in the credential store, so we should remove it from our list
      // describing the keys in the store.
      this.setPublicDescriptorsOfEncryptedDiceKeys(
        removePublicKeyDescriptor(this.publicDescriptorsOfEncryptedDiceKeys, {keyId})
      );
    } catch {
      // The user either failed to unlock the credential store or decided not to.
      // fall through to return undefined.
    }
    return undefined;
  }

  delete = async (toRemove: {keyId: string} | PublicDiceKeyDescriptor) => {
    await electronBridge.deleteDiceKeyFromCredentialStore(toRemove.keyId);
    this.setPublicDescriptorsOfEncryptedDiceKeys(removePublicKeyDescriptor(this.publicDescriptorsOfEncryptedDiceKeys, toRemove));
  };

  deleteAll = async () => {
    // console.log(`Remove all`);
    await Promise.all([...this.publicDescriptorsOfEncryptedDiceKeys].map(
      ({keyId}) => electronBridge.deleteDiceKeyFromCredentialStore(keyId) 
    ));
    this.setPublicDescriptorsOfEncryptedDiceKeys([]);
  };

  get storedDiceKeys(): PublicDiceKeyDescriptor[] {
    return [...this.publicDescriptorsOfEncryptedDiceKeys];
  }


  constructor() {
    this._publicDescriptorsOfEncryptedDiceKeys = [];
    makeAutoObservable(this);
    autoSave(this, "EncryptedDiceKeyMetadataStore");
  }
}
export const EncryptedDiceKeyStore = new EncryptedDiceKeyStoreClass();
