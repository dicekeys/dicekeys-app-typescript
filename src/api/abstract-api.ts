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
  DerivationOptions
} from "./derivation-options"
import {
  GenerateSignatureResult
} from "../api/generate-signature-result";
import {
  urlSafeBase64Encode
} from "./encodings";
import {
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  UnsealingInstructions
} from "./unsealing-instructions";
import {
  randomBytes
} from "crypto";

export interface UnmsarshallerForResponse {
  getOptionalStringParameter: (name: string) => string | undefined;
  getStringParameter: (name: string) => string;
  getBinaryParameter: (name: string) => Uint8Array;
}

export abstract class Api {
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
  ) {}

  protected abstract call: <T>(
    command: Command,
    authTokenRequired: boolean,
    parameters: [string, string | Uint8Array | {toJson: () => string} ][],
    processResponse: (unmarshallerForResponse: UnmsarshallerForResponse) => T
  ) => Promise<T>;

  protected generateRequestId = (): string => {
    if (global.window && window.crypto) {
      const randomBytes = new Uint8Array(20);
      crypto.getRandomValues(randomBytes);
      return urlSafeBase64Encode(randomBytes);
    } else {
      return urlSafeBase64Encode((randomBytes(20)));
    }
  }

  /**
   * Deferrable API (the one we actually implement, rather than wrap)
   */
  private authToken?: string;
  protected getAuthToken = async (forceReload: boolean = false): Promise<string> => {
    if (forceReload || !this.authToken) {
      this.authToken = await this.call(
        Commands.getAuthToken,
        false,
        [],
        p => p.getStringParameter(Outputs.getAuthToken.authToken)
      );
    }
    return this.authToken!;
  }

  /**
   * Sign a [message] using a public/private signing key pair derived
   * from the user's DiceKey and the [ApiDerivationOptions] specified in JSON format via
   * [derivationOptionsJson].
   */
  public generateSignature = async (
    derivationOptionsJson: string,
    message: Uint8Array
  ): Promise<GenerateSignatureResult> => this.call(
    Commands.generateSignature,
    DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
    [
      [Inputs.generateSignature.derivationOptionsJson, derivationOptionsJson],
      [Inputs.generateSignature.message, message]
    ],
    p => {
      const signature = p.getBinaryParameter(Outputs.generateSignature.signature)
      const signatureVerificationKey = this.seededCryptoModule.SignatureVerificationKey.fromJson(
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
  getSecret = (
    derivationOptionsJson: string
  ): Promise<Secret> => this.call(
    Commands.getSecret,
    DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
    [
      [Inputs.getSecret.derivationOptionsJson, derivationOptionsJson]
    ],
    p => this.seededCryptoModule.Secret.fromJson(p.getStringParameter(Outputs.getSecret.secret))
  );

  /**
   * Get an [UnsealingKey] derived from the user's DiceKey (the seed) and the key-derivation options
   * specified via [derivationOptionsJson],
   * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
   * which must specify
   *  `"clientMayRetrieveKey": true`.
   */
  getUnsealingKey = (
    derivationOptionsJson: string
  ): Promise<UnsealingKey> => this.call(
    Commands.getUnsealingKey,
    DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
    [ 
      [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ]
    ],
    p => this.seededCryptoModule.UnsealingKey.fromJson(p.getStringParameter(Outputs.getUnsealingKey.unsealingKey))
  );


    /**
     * Get a [SymmetricKey] derived from the user's DiceKey (the seed) and the key-derivation options
     * specified via [derivationOptionsJson],
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
     * which must specify
     *  `"clientMayRetrieveKey": true`.
     */
    getSymmetricKey = (
      derivationOptionsJson: string
    ): Promise<SymmetricKey> => this.call(
      Commands.getSymmetricKey,
      DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
      [ 
        [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ]
      ],
        p => this.seededCryptoModule.SymmetricKey.fromJson(p.getStringParameter(Outputs.getSymmetricKey.symmetricKey))
    );
 
    /**
     * Get a [SigningKey] derived from the user's DiceKey (the seed) and the key-derivation options
     * specified via [derivationOptionsJson],
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html),
     * which must specify
     *  `"clientMayRetrieveKey": true`.
     */
    getSigningKey = (
      derivationOptionsJson: string
    ): Promise<SigningKey> => this.call(
      Commands.getSigningKey,
      DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
      [ 
        [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ]
      ],
        p => this.seededCryptoModule.SigningKey.fromJson(p.getStringParameter(Outputs.getSigningKey.signingKey))
    );


    /**
     * Get a [SealingKey] derived from the user's DiceKey and the [ApiDerivationOptions] specified
     * in [Key-Derivation Options JSON Format](hhttps://dicekeys.github.io/seeded-crypto/derivation_options_format.html)
     * as [derivationOptionsJson].
     */
    getSealingKey = (
      derivationOptionsJson: string
    ): Promise<SealingKey> => this.call(
      Commands.getSealingKey,
      DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
      [ 
        [Inputs.getUnsealingKey.derivationOptionsJson, derivationOptionsJson ]
      ],
        p => this.seededCryptoModule.SealingKey.fromJson(p.getStringParameter(Outputs.getSealingKey.sealingKey))
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
    unsealWithUnsealingKey = (
      packagedSealedMessage: PackagedSealedMessage
    ): Promise<Uint8Array> => this.call(
      Commands.unsealWithUnsealingKey,
      (
        DerivationOptions(packagedSealedMessage.derivationOptionsJson).requireAuthenticationHandshake!! ||
        UnsealingInstructions(packagedSealedMessage.unsealingInstructions).requireAuthenticationHandshake!!
      ),
      [ [ Inputs.unsealWithUnsealingKey.packagedSealedMessage, packagedSealedMessage ]],
      p => p.getBinaryParameter(Outputs.unsealWithUnsealingKey.plaintext)
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
    sealWithSymmetricKey = (
      derivationOptionsJson: string,
      plaintext: Uint8Array,
      unsealingInstructions: string = ""
    ): Promise<PackagedSealedMessage> =>
      this.call(
        Commands.sealWithSymmetricKey, 
        DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
        [
          [Inputs.sealWithSymmetricKey.derivationOptionsJson, derivationOptionsJson],
          [Inputs.sealWithSymmetricKey.plaintext, plaintext],
          [Inputs.sealWithSymmetricKey.unsealingInstructions, unsealingInstructions]  
        ],
        p => this.seededCryptoModule.PackagedSealedMessage.fromJson(
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
    unsealWithSymmetricKey = (
      packagedSealedMessage: PackagedSealedMessage
    ): Promise<Uint8Array> => this.call(
      Commands.unsealWithSymmetricKey,
      (
        DerivationOptions(packagedSealedMessage.derivationOptionsJson).requireAuthenticationHandshake!! ||
        UnsealingInstructions(packagedSealedMessage.unsealingInstructions).requireAuthenticationHandshake!!
      ),
      [
        [Inputs.unsealWithSymmetricKey.packagedSealedMessage, packagedSealedMessage ]
      ],
      p => p.getBinaryParameter(Outputs.unsealWithSymmetricKey.plaintext)
    )
    
    /**
     * Get a public [SignatureVerificationKey] derived from the user's DiceKey and the
     * [ApiDerivationOptions] specified in JSON format via [derivationOptionsJson]
     */
    getSignatureVerificationKey = (
      derivationOptionsJson: string
    ): Promise<SignatureVerificationKey> => this.call(
      Commands.getSignatureVerificationKey,
      DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
      [
        [Inputs.getSignatureVerificationKey.derivationOptionsJson, derivationOptionsJson]
      ],
      p => this.seededCryptoModule.SignatureVerificationKey.fromJson(
        p.getStringParameter(Outputs.getSignatureVerificationKey.signatureVerificationKey))
    );

}
