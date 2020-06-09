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
  GenerateSignatureResult
} from "@dicekeys/dicekeys-api-js";

interface Callback<T> {
  onComplete(result: T): void
  onException(e?: Error): void
}
  
interface CallbackApi {
  
    getSecret(
      derivationOptionsJson: String,
      callback?: Callback<Secret>
    ): void
  
    /**
     * Get a [UnsealingKey] derived from the user's DiceKey (the seed) and the key-derivation options
     * specified via [derivationOptionsJson],
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
     * which must specify
     *  `"clientMayRetrieveKey": true`.
     */
    getUnsealingKey(
      derivationOptionsJson: String,
      callback?: Callback<UnsealingKey>
    ): void
  
  
    /**
     * Get a [SymmetricKey] derived from the user's DiceKey (the seed) and the key-derivation options
     * specified via [derivationOptionsJson],
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
     * which must specify
     *  `"clientMayRetrieveKey": true`.
     */
    getSymmetricKey(
      derivationOptionsJson: String,
      callback?: Callback<SymmetricKey>
    ): void
  
    /**
     * Get a [SigningKey] derived from the user's DiceKey (the seed) and the key-derivation options
     * specified via [derivationOptionsJson],
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
     * which must specify
     *  `"clientMayRetrieveKey": true`.
     */
    getSigningKey(
      derivationOptionsJson: String,
      callback?: Callback<SigningKey>
    ): void
  
  
    /**
     * Get a [SealingKey] derived from the user's DiceKey and the [ApiDerivationOptions] specified
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html)
     * as [derivationOptionsJson].
     */
    getSealingKey(
      derivationOptionsJson: String,
      callback?: Callback<SealingKey>
    ): void
  
    /**
     * Unseal (decrypt & authenticate) a message that was previously sealed with a
     * [SealingKey] to construct a [PackagedSealedMessage].
     * The public/private key pair will be re-derived from the user's seed (DiceKey) and the
     * key-derivation options packaged with the message.  It will also ensure that the
     * unsealing_instructions instructions have not changed since the message was packaged.
     *
     * @throws [CryptographicVerificationFailureException]
     */
    unsealWithUnsealingKey(
      packagedSealedMessage: PackagedSealedMessage,
      callback?: Callback<Uint8Array>
    ): void
  
    /**
     * Seal (encrypt with a message-authentication code) a message ([plaintext]) with a
     * symmetric key derived from the user's DiceKey, the
     * [derivationOptionsJson]
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
     * and [UnsealingInstructions] specified via a JSON string as
     * [unsealingInstructions] in the
     * in [Post-Decryption Instructions JSON Format](https://dicekeys.github.io/seeded-crypto/unsealing_instructions_format.html).
     */
    sealWithSymmetricKey(
      derivationOptionsJson: String,
      plaintext: Uint8Array,
      unsealingInstructions?: String,
      callback?: Callback<PackagedSealedMessage>
    ): void
  
  
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
    unsealWithSymmetricKey(
      packagedSealedMessage: PackagedSealedMessage,
      callback?: Callback<Uint8Array>
    ): void
  
  
    /**
     * Get a public [SignatureVerificationKey] derived from the user's DiceKey and the
     * [ApiDerivationOptions] specified in JSON format via [derivationOptionsJson]
     */
    getSignatureVerificationKey(
      derivationOptionsJson: String,
      callback?: Callback<SignatureVerificationKey>
    ): void
  
    /**
     * Sign a [message] using a public/private signing key pair derived
     * from the user's DiceKey and the [ApiDerivationOptions] specified in JSON format via
     * [derivationOptionsJson].
     */
    generateSignature(
      derivationOptionsJson: String,
      message: Uint8Array,
      callback?: Callback<GenerateSignatureResult>
    ): void
  
  }