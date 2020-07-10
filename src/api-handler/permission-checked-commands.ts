import {
  PackagedSealedMessage,
  Secret,
  SealingKey,
  SignatureVerificationKey,
  SigningKey,
  SymmetricKey,
  UnsealingKey,
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  DerivableObjectNames, ApiStrings, DerivationOptions,
  ApiCalls,
  secretToPasswordWithSpacesBetweenWords
} from "@dicekeys/dicekeys-api-js";
import {
  PermissionCheckedSeedAccessor
} from "./permission-checked-seed-accessor";
import { DiceKeyAppState } from "../state/app-state-dicekey";

/**
 * Implements the server-side API calls and the necessary permission checks,
 * using a structure that's locally testable
 * (all intent marshalling and unmarshalling occurs outside this library.)
 *
 * Internally, this class does not have access to the user's raw DiceKey (KeySqrState).
 * The only way it can get seeds is by calling the [PermissionCheckedSeedAccessor]
 * to get the seeds. ([PermissionCheckedSeedAccessor] acts as a reference monitor.)
 *
 * The caller is responsible for catching exceptions
 */
export class PermissionCheckedCommands {
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
    private permissionCheckedSeedAccessor: PermissionCheckedSeedAccessor,
  ) {}

  public getAuthToken = (respondToUrl: string): string =>
    DiceKeyAppState.instance!!.addAuthenticationToken(respondToUrl);

  imp = <METHOD extends ApiCalls.ApiCall>(
    command: ApiCalls.ApiCommand<METHOD>,
    implementation: (
        seedString: string,
        parameters: ApiCalls.ApiCallParameters<METHOD>
      ) => ApiCalls.ApiCallResult<METHOD>
  ): (parameters: ApiCalls.ApiCallParameters<METHOD>) => ApiCalls.ApiCallResult<METHOD> =>
      (
        parameters: ApiCalls.ApiCallParameters<METHOD>
      ) => implementation("", {command, ...parameters} as ApiCalls.ApiRequestObject<METHOD>);

  getSecret = this.imp<ApiCalls.GetSecret>(
    "getSecret",
    (seedString, {derivationOptionsJson}) => {
      return this.seededCryptoModule.Secret.deriveFromSeed(
        seedString, derivationOptionsJson)
    }
  )
      
  /**
   * Implement [DiceKeysIntentApiClient.getSecret] with the necessary permissions checks
   */
  public getSecret = async (originalDerivationOptionsJson: string): Promise<Secret> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfNotAuthorizedAsync(
      ApiStrings.Commands.getSecret,
      originalDerivationOptionsJson,
      DerivableObjectNames.Secret
    ).then( ({seedString, derivationOptionsJson}) =>
      this.seededCryptoModule.Secret.deriveFromSeed(
        seedString, derivationOptionsJson)
    )

    public getPassword = async (
      originalDerivationOptionsJson: string,
      wordLimit?: number
    ) =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfNotAuthorizedAsync(
      ApiStrings.Commands.getPassword,
      originalDerivationOptionsJson,
      DerivableObjectNames.Secret
    ).then( async ({seedString, derivationOptionsJson}) => {
        const secret = this.seededCryptoModule.Secret.deriveFromSeed(
          seedString, derivationOptionsJson)
        try {
          const {wordList = "en_1024_words_5_chars_max_20200709"} = DerivationOptions(derivationOptionsJson);
          const options = wordLimit != null ? {wordsNeeded: wordLimit} : {}; 
          const password = secretToPasswordWithSpacesBetweenWords( secret.secretBytes, wordList, options );
          return {password, derivationOptionsJson};
        } finally {
          secret.delete();
        }
      }
    )


  /**
   * Implement [DiceKeysIntentApiClient.sealWithSymmetricKey] with the necessary permissions checks
   */
  // public sealWithSymmetricKey = async (
  //   derivationOptionsJson: string,
  //   plaintext: Uint8Array,
  //   unsealingInstructions?: string
  // ): Promise<PackagedSealedMessage> =>
  // this.seededCryptoModule.SymmetricKey.sealWithInstructions(
  //   plaintext,
  //   unsealingInstructions ?? "",
  //   await this.permissionCheckedSeedAccessor.getSeedOrThrowIfClientNotAuthorizedAsync(
  //       derivationOptionsJson,
  //       DerivableObjectNames.SymmetricKey
  //   ),
  //   derivationOptionsJson
  // );
  public sealWithSymmetricKey = (
    originalDerivationOptionsJson: string,
    plaintext: Uint8Array,
    unsealingInstructions?: string
  ): Promise<PackagedSealedMessage> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfNotAuthorizedAsync(
      ApiStrings.Commands.sealWithSymmetricKey,
      originalDerivationOptionsJson,
      DerivableObjectNames.SymmetricKey
    ).then( ({seedString, derivationOptionsJson}) =>
      this.seededCryptoModule.SymmetricKey.sealWithInstructions(
        plaintext,
        unsealingInstructions ?? "",
        seedString,
        derivationOptionsJson
      )
    );

  /**
   * Implement [DiceKeysIntentApiClient.unsealWithSymmetricKey] with the necessary permissions checks
   */
  public unsealWithSymmetricKey = async (
    packagedSealedMessage: PackagedSealedMessage
  ) : Promise<Uint8Array> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfClientNotAuthorizedToUnsealAsync(
      ApiStrings.Commands.unsealWithSymmetricKey,
      packagedSealedMessage,
      DerivableObjectNames.SymmetricKey
    ).then( ({seedString}) =>
      this.seededCryptoModule.SymmetricKey.unseal(
        packagedSealedMessage,
        seedString
      )
    )

  /**
   * Implement [DiceKeysIntentApiClient.getSealingKey] with the necessary permissions checks
   */
  public getSealingKey = async (
    originalDerivationOptionsJson: string
  ) : Promise<SealingKey> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfNotAuthorizedAsync(
      ApiStrings.Commands.getSealingKey,
      originalDerivationOptionsJson,
      DerivableObjectNames.UnsealingKey
    ).then( ({seedString, derivationOptionsJson}) =>
      this.seededCryptoModule.UnsealingKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      ).getSealingKey()
    );

  /**
   * Implement [DiceKeysIntentApiClient.getUnsealingKey] with the necessary permissions checks
   */
  public getUnsealingKey = async (
    originalDerivationOptionsJson: string
  ) : Promise<UnsealingKey> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfClientsMayNotRetrieveKeysOrThisClientNotAuthorizedAsync(
      ApiStrings.Commands.getUnsealingKey,
      originalDerivationOptionsJson,
      DerivableObjectNames.UnsealingKey
    ).then( ({seedString, derivationOptionsJson}) =>
      this.seededCryptoModule.UnsealingKey.deriveFromSeed(
        seedString, derivationOptionsJson
      )
    );

  /**
   * Implement [DiceKeysIntentApiClient.getSigningKey] with the necessary permissions checks
   */
  public getSigningKey = async (
    originalDerivationOptionsJson: string
  ) : Promise<SigningKey> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfClientsMayNotRetrieveKeysOrThisClientNotAuthorizedAsync(
      ApiStrings.Commands.getSigningKey,
      originalDerivationOptionsJson,
      DerivableObjectNames.SigningKey
    ).then( ({seedString, derivationOptionsJson}) =>
      this.seededCryptoModule.SigningKey.deriveFromSeed(
        seedString, derivationOptionsJson
      )
    );

  /**
   * Implement [DiceKeysIntentApiClient.getSymmetricKey] with the necessary permissions checks
   */
  public getSymmetricKey = async (
    originalDerivationOptionsJson: string
  ) : Promise<SymmetricKey> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfClientsMayNotRetrieveKeysOrThisClientNotAuthorizedAsync(
      ApiStrings.Commands.getSymmetricKey,
      originalDerivationOptionsJson,
      DerivableObjectNames.SymmetricKey
    ).then( ({seedString, derivationOptionsJson}) =>
      this.seededCryptoModule.SymmetricKey.deriveFromSeed(
        seedString, derivationOptionsJson
      )
    );

  /**
   * Implement [DiceKeysIntentApiClient.getSignatureVerificationKey] with the necessary permissions checks
   */
  public getSignatureVerificationKey = async (
    derivationOptionsJson: string
  ) : Promise<SignatureVerificationKey> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfNotAuthorizedAsync(
      ApiStrings.Commands.getSignatureVerificationKey,
      derivationOptionsJson,
      DerivableObjectNames.SigningKey
    ).then( ({seedString, derivationOptionsJson}) =>
      this.seededCryptoModule.SigningKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      ).getSignatureVerificationKey()
    );

    /**
   * Implement [DiceKeysIntentApiClient.unsealWithUnsealingKey] with the necessary permissions checks
   */
  public unsealWithUnsealingKey = async (
    packagedSealedMessage: PackagedSealedMessage
  ) : Promise<Uint8Array> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfClientNotAuthorizedToUnsealAsync(
      ApiStrings.Commands.unsealWithUnsealingKey,
      packagedSealedMessage,
      DerivableObjectNames.UnsealingKey
    ).then( ({seedString}) =>
      this.seededCryptoModule.UnsealingKey.deriveFromSeed(
        seedString, packagedSealedMessage.derivationOptionsJson
      ).unseal(packagedSealedMessage)
    );

  /**
   * Implement [DiceKeysIntentApiClient.generateSignature] with the necessary permissions checks
   */
  public generateSignature = async (
    originalDerivationOptionsJson: string,
    message: Uint8Array
  ): Promise<[Uint8Array, SignatureVerificationKey]> =>
    this.permissionCheckedSeedAccessor.getSeedOrThrowIfNotAuthorizedAsync(
      ApiStrings.Commands.generateSignature,
      originalDerivationOptionsJson,
      DerivableObjectNames.SigningKey
    ).then( ({seedString, derivationOptionsJson}) => {
      const signingKey = this.seededCryptoModule.SigningKey.deriveFromSeed(
          seedString, derivationOptionsJson
        );
      return [ signingKey.generateSignature(message), signingKey.getSignatureVerificationKey()]
    });
}