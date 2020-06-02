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
  AuthenticationRequirements
} from "./derivation-options";
import { urlSafeBase64Decode, urlSafeBase64Encode } from "./base64";
import { SeededCryptoModulePromise, SeededCryptoModuleWithHelpers } from "@dicekeys/seeded-crypto-js";
import { UnsealingInstructions } from "./unsealing-instructions";

class Api {
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
    private requestUrlBase: string,
    private respondToUrl: string
  ) {}

  private pendingCallResolveFunctions = new Map<string, (url: URL) => any>();

  protected call = async <T>(
    command: Command,
    authTokenRequired: boolean,
    parameters: [string, string | Uint8Array | {toJson: () => string} ][],
    processResponse: (responseUrl: URL) => T
  ) : Promise<T> => {
    const requestId = "fixme";
    const requestUrl = new URL(this.requestUrlBase);
    requestUrl.searchParams.set(Inputs.COMMON.requestId, requestId);
    requestUrl.searchParams.set(Inputs.COMMON.respondTo, this.respondToUrl);
    requestUrl.searchParams.set(Inputs.COMMON.command, command);
    if (authTokenRequired) {
      const authToken = await this.getAuthToken();
      requestUrl.searchParams.set(Inputs.COMMON.authToken, authToken);
    }
    parameters.forEach( ([name, value]) =>
      requestUrl.searchParams.set(
        name,
        (typeof value === "string") ?
          value :
          "toJson" in value ?
            value.toJson() :
            urlSafeBase64Encode(value)
    ));
    const urlPromise = new Promise<URL>( (resolve) => this.pendingCallResolveFunctions.set(requestId, resolve));
    // handle parameters here
    /// issue call here.
    // FIXME
    //     window.location.assign(requestUrl.)    
    const url = await urlPromise;
    return processResponse(url);
  }

  private authTokenParameterIfRequired = async (
    authenticationRequirements: AuthenticationRequirements
  ): Promise<[string, string][]> =>
    authenticationRequirements.requireAuthenticationHandshake ?
    [
      [Inputs.COMMON.authToken, await this.getAuthToken()]
    ] :
    []


  /**
   * Activities and Fragments that use this API should implement onActivityResult and
   * and call handleOnActivityResult with the data/intent (third parameter) received.
   * Doing so allows this class to process results returned to the activity/fragment
   * and then call the appropriate callback functions when an API call has either
   * succeeded or failed.
   */
  handleResult = (result: URL) => {
    const requestId = result.searchParams.get(Outputs.COMMON.requestId);
    if (requestId && this.pendingCallResolveFunctions.has(requestId)) {
      const resolveFn = this.pendingCallResolveFunctions.get(requestId);
      this.pendingCallResolveFunctions.delete(requestId);
      resolveFn!(result);
    }
  }

  /**
   * Deferrable API (the one we actually implement, rather than wrap)
   */
  private authToken?: string;
  private getAuthToken = async (forceReload: boolean = false): Promise<string> => {
    if (forceReload || !this.authToken) {
      this.authToken = await this.call(
        Commands.getAuthToken,
        false,
        [],
        url => url.searchParams.get(Outputs.getAuthToken.authToken)!
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
    url => {
      const signature = urlSafeBase64Decode(url.searchParams.get(Outputs.generateSignature.signature)!)
      const signatureVerificationKey = this.seededCryptoModule.SignatureVerificationKey.fromJson(
        url.searchParams.get(Outputs.generateSignature.signatureVerificationKey)!);
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
    url => this.seededCryptoModule.Secret.fromJson(url.searchParams.get(Outputs.getSecret.secret)!)
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
    url => this.seededCryptoModule.UnsealingKey.fromJson(url.searchParams.get(Outputs.getUnsealingKey.unsealingKey)!)
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
        url => this.seededCryptoModule.SymmetricKey.fromJson(url.searchParams.get(Outputs.getSymmetricKey.symmetricKey)!)
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
        url => this.seededCryptoModule.SigningKey.fromJson(url.searchParams.get(Outputs.getSigningKey.signingKey)!)
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
        url => this.seededCryptoModule.SealingKey.fromJson(url.searchParams.get(Outputs.getSealingKey.sealingKey)!)
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
      url => urlSafeBase64Decode(url.searchParams.get((Outputs.unsealWithUnsealingKey.plaintext))!)
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
      unsealingInstructions: string
    ): Promise<PackagedSealedMessage> =>
      this.call(
        Commands.sealWithSymmetricKey, 
        DerivationOptions(derivationOptionsJson).requireAuthenticationHandshake!!,
        [
          [Inputs.sealWithSymmetricKey.derivationOptionsJson, derivationOptionsJson],
          [Inputs.sealWithSymmetricKey.plaintext, plaintext],
          [Inputs.sealWithSymmetricKey.unsealingInstructions, unsealingInstructions]  
        ],
        url => this.seededCryptoModule.PackagedSealedMessage.fromJson(
          url.searchParams.get(Outputs.sealWithSymmetricKey.packagedSealedMessage)!)
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
      Commands.unsealWithUnsealingKey,
      (
        DerivationOptions(packagedSealedMessage.derivationOptionsJson).requireAuthenticationHandshake!! ||
        UnsealingInstructions(packagedSealedMessage.unsealingInstructions).requireAuthenticationHandshake!!
      ),
      [
        [Inputs.unsealWithSymmetricKey.packagedSealedMessage, packagedSealedMessage ]
      ],
      url => urlSafeBase64Decode(url.searchParams.get(Outputs.unsealWithSymmetricKey.plaintext)!)
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
      url => this.seededCryptoModule.SignatureVerificationKey.fromJson(
        url.searchParams.get(Outputs.getSignatureVerificationKey.signatureVerificationKey)!)
    );

}