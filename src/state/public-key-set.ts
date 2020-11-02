import {
  SealingKeyJson,
  SignatureVerificationKeyJson,
  urlSafeBase64Encode,
} from "@dicekeys/dicekeys-api-js";
import { SeededCryptoModuleWithHelpers } from "@dicekeys/seeded-crypto-js";
import { getRandomBytes } from "../dicekeys/get-random-bytes";
import { LocalStorageField } from "../web-component-framework/locally-stored-state";


export const diceKeyIdToNicknameMap = new LocalStorageField<{[keyId: string]: string}>("DiceKeyIdToNickname");

export interface PublicKeySet {
  sealingKeys: SealingKeyJson[],
  signatureVerificationKeys: SignatureVerificationKeyJson[];
}

export interface PublicKeySets {
  [keyId: string]: PublicKeySet; 
}

export const consumeSealingKey = (
  accessor: {diceKeyPublicKeySet: PublicKeySet | undefined}
) => () => {
  // Read from local storage
  const diceKeyPublicKeySet = accessor.diceKeyPublicKeySet;
  // Return undefined if nothing in local storage
  if (diceKeyPublicKeySet == null) return undefined;
  // Get and remove a sealing key, or get undefined if the list is empty 
  const key = diceKeyPublicKeySet.sealingKeys.shift();
  // Write back from local storage
  accessor.diceKeyPublicKeySet = diceKeyPublicKeySet;
  // Return the sealing key if found
  return key;
}

export const consumeSignatureVerificationKey = (
  accessor: {diceKeyPublicKeySet: PublicKeySet | undefined}
) => () => {
  // Read from local storage
  const diceKeyPublicKeySet = accessor.diceKeyPublicKeySet;
  // Return undefined if nothing in local storage
  if (diceKeyPublicKeySet == null) return undefined;
  // Get and remove a sealing key, or get undefined if the list is empty 
  const key = diceKeyPublicKeySet.signatureVerificationKeys.shift();
  // Write back from local storage
  accessor.diceKeyPublicKeySet = diceKeyPublicKeySet;
  // Return the sealing key if found
  return key;
}

export type PopulatePublicKeyCacheFn = (
  seedString: string,
  options: {
    numberOfSealingKeysToStore?: number,
    numberOfSignatureVerificationKeysToStore?: number,
    numberOfSealingKeysToAdd?: number,
    numberOfSignatureVerificationKeysToAdd?: number,
  }) => void;

export const populatePublicKeyCacheFnFactory = (
  seededCryptoModule: SeededCryptoModuleWithHelpers,
  accessor: {publicKeySet: PublicKeySet | undefined}
): PopulatePublicKeyCacheFn => (seedString: string,  options) => {
  const publicKeySet = accessor.publicKeySet ?? {sealingKeys: [], signatureVerificationKeys: []};
  const {
    numberOfSealingKeysToStore = 10,
    numberOfSignatureVerificationKeysToStore = 10,
    numberOfSealingKeysToAdd: numberOfSealingKeysToAdd = numberOfSealingKeysToStore - publicKeySet.sealingKeys.length,
    numberOfSignatureVerificationKeysToAdd = numberOfSignatureVerificationKeysToStore - publicKeySet.signatureVerificationKeys.length,
  } = options;
  for (var i = 0; i < numberOfSealingKeysToAdd; i++) {
    const uniqueId = urlSafeBase64Encode(getRandomBytes(8))
    const key = seededCryptoModule.SealingKey.deriveFromSeed(seedString, JSON.stringify({uniqueId}));
    const keyJson = JSON.parse(key.toJson()) as SealingKeyJson;
    key.delete;
    publicKeySet.sealingKeys.push(keyJson);
  }
  for (var i = 0; i < numberOfSignatureVerificationKeysToAdd; i++) {
    const uniqueId = urlSafeBase64Encode(getRandomBytes(8))
    const key = seededCryptoModule.SignatureVerificationKey.deriveFromSeed(seedString, JSON.stringify({uniqueId}));
    const keyJson = JSON.parse(key.toJson()) as SignatureVerificationKeyJson;
    key.delete;
    publicKeySet.signatureVerificationKeys.push(keyJson);
  }
  accessor.publicKeySet = publicKeySet;
}