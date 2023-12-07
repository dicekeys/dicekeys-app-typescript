import { action, makeAutoObservable } from "mobx";
import { autoSave } from "../core/AutoSave";
import { DiceKey, DiceKeyWithKeyId, PublicDiceKeyDescriptor } from "../../dicekeys/DiceKey";
import { DiceKeyInHumanReadableForm } from "../../dicekeys/DiceKey";
import { electronBridge } from "../../state/core/ElectronBridge";

/**
 * Sort PublicDiceKeyDescriptors first by letter, then digit, then keyId.
 * @param descriptors
 * @returns 
 */
export const sortPublicDiceKeyDescriptors = <T extends PublicDiceKeyDescriptor>(descriptors: T[]): T[] =>
  descriptors.sort( (a, b) =>
    `${a.centerLetterAndDigit}${a.keyId}`.localeCompare(`${b.centerLetterAndDigit}${b.keyId}`)
);

const removePublicKeyDescriptor = (descriptors: PublicDiceKeyDescriptor[], toRemove: {keyId: string} | PublicDiceKeyDescriptor) =>
    descriptors.filter( ({keyId}) => keyId != toRemove.keyId );


const validatePublicDiceKeyDescriptor = (descriptor: PublicDiceKeyDescriptor): boolean =>
    // Validate the descriptor to ignore those from previous versions.
    descriptor != null &&
    typeof descriptor === "object" &&
    typeof descriptor.centerLetterAndDigit === "string" &&
    descriptor.centerLetterAndDigit.length === 2 &&
    typeof descriptor.keyId === "string";

class EncryptedDiceKeyStoreClass {
  protected _publicDescriptorsOfEncryptedDiceKeys: PublicDiceKeyDescriptor[];
  protected get publicDescriptorsOfEncryptedDiceKeys(): PublicDiceKeyDescriptor[] {
    return this._publicDescriptorsOfEncryptedDiceKeys.filter(validatePublicDiceKeyDescriptor);
  }

  protected setPublicDescriptorsOfEncryptedDiceKeys = action( (publicDescriptorsOfEncryptedDiceKeys: PublicDiceKeyDescriptor[]) => {
    this._publicDescriptorsOfEncryptedDiceKeys = sortPublicDiceKeyDescriptors(
      publicDescriptorsOfEncryptedDiceKeys.filter(validatePublicDiceKeyDescriptor)
    );
  });

  has = ({keyId}: {keyId: string} | PublicDiceKeyDescriptor) => this.publicDescriptorsOfEncryptedDiceKeys.some(
    descriptor => keyId === descriptor.keyId
  );

  add = async (diceKey: DiceKey) => {
    const {centerLetterAndDigit, inHumanReadableForm} = diceKey;
    const keyId = await diceKey.keyId;
    await electronBridge.storeDiceKeyInCredentialStore(keyId, inHumanReadableForm);
    this.setPublicDescriptorsOfEncryptedDiceKeys([
      ...removePublicKeyDescriptor(this.publicDescriptorsOfEncryptedDiceKeys, {keyId}),
      {keyId, centerLetterAndDigit}
    ]);
  };

  load = async ({keyId}: {keyId: string} | PublicDiceKeyDescriptor): Promise<DiceKeyWithKeyId | undefined> => {
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

  delete = async (diceKey: DiceKey) => {
    const keyId = await diceKey.keyId;
    await electronBridge.deleteDiceKeyFromCredentialStore(keyId);
    this.setPublicDescriptorsOfEncryptedDiceKeys(removePublicKeyDescriptor(this.publicDescriptorsOfEncryptedDiceKeys, {keyId}));
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
    autoSave(this, "EncryptedDiceKeyMetadataStore", true);
  }
}
export const EncryptedDiceKeyStore = new EncryptedDiceKeyStoreClass();
