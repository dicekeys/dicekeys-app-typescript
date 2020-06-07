import {
  PackagedSealedMessage,
  Secret,
  SealingKey,
  SignatureVerificationKey,
  SigningKey,
  SymmetricKey,
  UnsealingKey
} from "@dicekeys/seeded-crypto-js";
import {
  Inputs,
  Outputs,
  Command,
  Commands
} from "./api-strings";
import {
  GenerateSignatureResult
} from "../api/generate-signature-result";
import {
  urlSafeBase64Encode
} from "./encodings";
import {
  SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
import {
  randomBytes
} from "crypto";

export interface ApiClientImplementation{
  <T>(
    command: Command,
    parameters: [string, string | Uint8Array | {toJson: () => string} ][],
    processResponse: (unmarshallerForResponse: UnmsarshallerForResponse) => T | Promise<T>
  ): Promise<T>
}

export interface UnmsarshallerForResponse {
  getOptionalStringParameter: (name: string) => string | undefined;
  getStringParameter: (name: string) => string;
  getBinaryParameter: (name: string) => Uint8Array;
}

export const generateRequestId = (): string => {
  if (global.window && window.crypto) {
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    return urlSafeBase64Encode(randomBytes);
  } else {
    return urlSafeBase64Encode((randomBytes(20)));
  }
}

/**
 * Sign a [[message]] using a public/private signing key pair derived
 * from the user's DiceKey and the derivation options specified in
 * JSON format via [[derivationOptionsJson]].
 */

export const generateSignatureFactory = (call: ApiClientImplementation) =>/**
  * Sign a [[message]] using a public/private signing key pair derived
  * from the user's DiceKey and the derivation options specified in
  * JSON format via [[derivationOptionsJson]].
  */
  async  (
    derivationOptionsJson: string,
    message: Uint8Array
  ): Promise<GenerateSignatureResult> => call(
  Commands.generateSignature,
  [
    [Inputs.generateSignature.derivationOptionsJson, derivationOptionsJson],
    [Inputs.generateSignature.message, message]
  ],
  async p => {
    const signature = p.getBinaryParameter(Outputs.generateSignature.signature)
    const signatureVerificationKey = (await SeededCryptoModulePromise).SignatureVerificationKey.fromJson(
      p.getStringParameter(Outputs.generateSignature.signatureVerificationKey));
    return {
      signature,
      signatureVerificationKey
    } as GenerateSignatureResult;
  })

  /**
   * Derive a pseudo-random cryptographic [Secret] from the user's DiceKey and
   * the key-derivation options passed as [derivationOptionsJson]
   * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html).
   */
export const getSecretFactory = (call: ApiClientImplementation) => (
  derivationOptionsJson: string
): Promise<Secret> => call(
  Commands.getSecret,
  [
    [Inputs.getSecret.derivationOptionsJson, derivationOptionsJson]
  ],
  async (p) => (await SeededCryptoModulePromise).Secret.fromJson(p.getStringParameter(Outputs.getSecret.secret))
);

/**
 * Get an [UnsealingKey] derived from the user's DiceKey (the seed) and the key-derivation options
 * specified via [derivationOptionsJson],
 * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
 * which must specify
 *  `"clientMayRetrieveKey": true`.
 */
export const getUnsealingKeyFactory = (call: ApiClientImplementation) => (
  derivationOptionsJson: string
): Promise<UnsealingKey> => call(
  Commands.getUnsealingKey,
  [ 
    [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ]
  ],
  async (p) => (await SeededCryptoModulePromise).UnsealingKey.fromJson(p.getStringParameter(Outputs.getUnsealingKey.unsealingKey))
);


/**
 * Get a [SymmetricKey] derived from the user's DiceKey (the seed) and the key-derivation options
 * specified via [derivationOptionsJson],
 * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
 * which must specify
 *  `"clientMayRetrieveKey": true`.
 */
export const getSymmetricKeyFactory = (call: ApiClientImplementation) => (
  derivationOptionsJson: string
): Promise<SymmetricKey> => call(
  Commands.getSymmetricKey,
  [ 
    [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ]
  ],
  async (p) => (await SeededCryptoModulePromise).SymmetricKey.fromJson(p.getStringParameter(Outputs.getSymmetricKey.symmetricKey))
);

/**
 * Get a [SigningKey] derived from the user's DiceKey (the seed) and the key-derivation options
 * specified via [derivationOptionsJson],
 * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
 * which must specify
 *  `"clientMayRetrieveKey": true`.
 */
export const getSigningKeyFactory = (call: ApiClientImplementation) => (
  derivationOptionsJson: string
): Promise<SigningKey> => call(
  Commands.getSigningKey,
  [ 
    [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ]
  ],
    async (p) => (await SeededCryptoModulePromise).SigningKey.fromJson(p.getStringParameter(Outputs.getSigningKey.signingKey))
);


/**
 * Get a [SealingKey] derived from the user's DiceKey and the [ApiDerivationOptions] specified
 * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html)
 * as [derivationOptionsJson].
 */
export const getSealingKeyFactory = (call: ApiClientImplementation) => (
  derivationOptionsJson: string
): Promise<SealingKey> => call(
  Commands.getSealingKey,
  [ [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ] ],
  async (p) => (await SeededCryptoModulePromise).SealingKey.fromJson(p.getStringParameter(Outputs.getSealingKey.sealingKey))
);


/**
 * Unseal (decrypt & authenticate) a message that was previously sealed with a
 * [SealingKey] to construct a [PackagedSealedMessage].
 * The public/private key pair will be re-derived from the user's seed (DiceKey) and the
 * key-derivation options packaged with the message.  It will also ensure that the
 * unsealing_instructions instructions have not changed since the message was packaged.
 *
 * @throws [CryptographicVerificationFailureException]
 */
export const unsealWithUnsealingKeyFactory = (call: ApiClientImplementation) => (
  packagedSealedMessage: PackagedSealedMessage
): Promise<Uint8Array> => call(
  Commands.unsealWithUnsealingKey,
  [ [ Inputs.unsealWithUnsealingKey.packagedSealedMessage, packagedSealedMessage ]],
  async (p) => p.getBinaryParameter(Outputs.unsealWithUnsealingKey.plaintext)
);

/**
 * Seal (encrypt with a message-authentication code) a message ([plaintext]) with a
 * symmetric key derived from the user's DiceKey, the
 * [derivationOptionsJson]
 * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
 * and [UnsealingInstructions] specified via a JSON string as
 * [unsealingInstructions] in the
 * in [Post-Decryption Instructions JSON Format](https://dicekeys.github.io/seeded-crypto/unsealing_instructions_format.html).
 */
export const sealWithSymmetricKeyFactory = (call: ApiClientImplementation) => (
  derivationOptionsJson: string,
  plaintext: Uint8Array,
  unsealingInstructions: string = ""
): Promise<PackagedSealedMessage> =>
  call(
    Commands.sealWithSymmetricKey, 
    [
      [Inputs.sealWithSymmetricKey.derivationOptionsJson, derivationOptionsJson],
      [Inputs.sealWithSymmetricKey.plaintext, plaintext],
      [Inputs.sealWithSymmetricKey.unsealingInstructions, unsealingInstructions]  
    ],
    async (p) => (await SeededCryptoModulePromise).PackagedSealedMessage.fromJson(
      p.getStringParameter(Outputs.sealWithSymmetricKey.packagedSealedMessage))
  );

/**
 * Unseal (decrypt & authenticate) a [packagedSealedMessage] that was previously sealed with a
 * symmetric key derived from the user's DiceKey, the
 * [ApiDerivationOptions] specified in JSON format via [PackagedSealedMessage.derivationOptionsJson],
 * and any [UnsealingInstructions] optionally specified by [PackagedSealedMessage.unsealingInstructions]
 * in [Post-Decryption Instructions JSON Format](https://dicekeys.github.io/seeded-crypto/unsealing_instructions_format.html).
 *
 * If any of those strings change, the wrong key will be derive and the message will
 * not be successfully unsealed, yielding a [org.dicekeys.crypto.seeded.CryptographicVerificationFailureException] exception.
 */
export const unsealWithSymmetricKeyFactory = (call: ApiClientImplementation) => (
  packagedSealedMessage: PackagedSealedMessage
): Promise<Uint8Array> => call(
  Commands.unsealWithSymmetricKey,
  [ [Inputs.unsealWithSymmetricKey.packagedSealedMessage, packagedSealedMessage ] ],
  async (p) => p.getBinaryParameter(Outputs.unsealWithSymmetricKey.plaintext)
);
    
/**
 * Get a public [SignatureVerificationKey] derived from the user's DiceKey and the
 * [ApiDerivationOptions] specified in JSON format via [derivationOptionsJson]
 */
export const getSignatureVerificationKeyFactory = (call: ApiClientImplementation) => (
  derivationOptionsJson: string
): Promise<SignatureVerificationKey> => call(
  Commands.getSignatureVerificationKey,
  [ [Inputs.getSignatureVerificationKey.derivationOptionsJson, derivationOptionsJson] ],
  async (p) => (await SeededCryptoModulePromise).SignatureVerificationKey.fromJson(
    p.getStringParameter(Outputs.getSignatureVerificationKey.signatureVerificationKey))
);
