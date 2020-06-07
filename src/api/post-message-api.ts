import {
  // API function factories
  generateSignatureFactory,
  getSealingKeyFactory,
  getSecretFactory,
  getSignatureVerificationKeyFactory,
  getSigningKeyFactory,
  getSymmetricKeyFactory,
  getUnsealingKeyFactory,
  sealWithSymmetricKeyFactory,
  unsealWithSymmetricKeyFactory,
  unsealWithUnsealingKeyFactory
} from "./api-factory"
import {
  postMessageApiCallFactory
} from "./post-message-api-factory";

const callPostMessageApi = postMessageApiCallFactory();

/**
  * Sign a [[message]] using a public/private signing key pair derived
  * from the user's DiceKey and the derivation options specified in
  * JSON format via [[derivationOptionsJson]].
*/
export const generateSignature = generateSignatureFactory(callPostMessageApi);
export const getSealingKey = getSealingKeyFactory(callPostMessageApi);
export const getSecret = getSecretFactory(callPostMessageApi);
export const getSignatureVerificationKey = getSignatureVerificationKeyFactory(callPostMessageApi);
export const getSigningKey = getSigningKeyFactory(callPostMessageApi);
export const getSymmetricKey = getSymmetricKeyFactory(callPostMessageApi);
export const getUnsealingKey = getUnsealingKeyFactory(callPostMessageApi);
export const sealWithSymmetricKey = sealWithSymmetricKeyFactory(callPostMessageApi);
export const unsealWithSymmetricKey = unsealWithSymmetricKeyFactory(callPostMessageApi);
export const unsealWithUnsealingKey = unsealWithUnsealingKeyFactory(callPostMessageApi);

