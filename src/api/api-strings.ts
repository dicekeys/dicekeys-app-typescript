

const requestId = "requestId";
const plaintext = "plaintext";
const command = "command";
const respondTo = "respondTo";
const authToken = "authToken";
const derivationOptionsJson = "derivationOptionsJson";
const packagedSealedMessage = "packagedSealedMessage";
const exception = "exception";
const exceptionMessage = "exceptionMessage";
const signature = "signature";
const sealingKey = "sealingKey";
const secret = "secret";
const signingKey = "signingKey";
const symmetricKey = "symmetricKey";
const unsealingKey = "unsealingKey";
const signatureVerificationKey = "signatureVerificationKey";


const withDerivationOptions = {
  derivationOptionsJson
} as const;

const getObject = {
  ...withDerivationOptions
} as const;
const unsealingInstructions = "unsealingInstructions";
const unseal = {
  packagedSealedMessage
} as const;


export const Inputs = {
  COMMON: {
    requestId,
    command,
    respondTo,
    authToken,
  } as const,

  // For URL-based APIs, the command name and the https uri to respond to
  generateSignature: {
    ...withDerivationOptions,
    message: "message"
  } as const,

  getSealingKey: getObject,
  getSecret: getObject,
  getSignatureVerificationKey: getObject,
  getSigningKey: getObject,
  getSymmetricKey: getObject,
  getUnsealingKey: getObject,

  sealWithSymmetricKey: {
    ...withDerivationOptions,
    plaintext,
    unsealingInstructions
  } as const,

  unsealWithSymmetricKey: {...unseal} as const,
  unsealWithUnsealingKey: {...unseal} as const,

}

export const Outputs = {
  COMMON: {
    requestId,
    exception,
    exceptionMessage,
  } as const,

  generateSignature: {
    signature,
    signatureVerificationKey
  } as const,

  getAuthToken: {
    authToken
  } as const,

  getSealingKey: {
    sealingKey
  } as const,

  getSecret: {
    secret
  } as const,

  getSignatureVerificationKey: {
    signatureVerificationKey
  } as const,

  getSigningKey: {
    signingKey
  } as const,

  getSymmetricKey: {
    symmetricKey
  } as const,

  getUnsealingKey: {
    unsealingKey
  } as const,

  sealWithSymmetricKey: {
    packagedSealedMessage
  } as const,

  unsealWithSymmetricKey: {
    plaintext
  } as const,

  unsealWithUnsealingKey: {
    plaintext
  } as const,
}
