import {
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  DerivationOptions,
  ApiCalls,
  secretToPasswordWithSpacesBetweenWords,
  Exceptions
} from "@dicekeys/dicekeys-api-js";
import { apiCommand } from "state/steps";
import { Commands } from "@dicekeys/dicekeys-api-js/dist/api-strings";


/**
 * Implements the server-side API calls
 *
 * Internally, this class does not have access to the user's raw seeds (DiceKeys).
 * Rather, the commands are to be seeded only after permission checks are complete.
 *
 * The caller is responsible for catching exceptions
 */
export class ApiCommands {
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers
  ) {}

  // public getAuthToken = (respondToUrl: string): string =>
  //   DiceKeyAppState.instance!!.addAuthenticationToken(respondToUrl);

  imp = <METHOD extends ApiCalls.ApiCall>(
//    command: ApiCalls.ApiCommand<METHOD>,
    implementation: (
        seedString: string,
        parameters: ApiCalls.ApiCallParameters<METHOD>
      ) => ApiCalls.ApiCallResult<METHOD>
  ) =>
    (seedString: string) =>
      (parameters: ApiCalls.ApiCallParameters<METHOD>) => 
        implementation(seedString, parameters);

  isUnsealingRequest = (request: ApiCalls.ApiRequestObject): request is ApiCalls.UnsealWithSymmetricKeyRequest | ApiCalls.UnsealWithUnsealingKeyRequest =>
    request.command === Commands.unsealWithSymmetricKey || request.command === Commands.unsealWithUnsealingKey;

  executeCommand = async (request: ApiCalls.ApiRequestObject): Promise<ApiCalls.ApiCallResult> => {
    var seedString: string | undefined;
    if (
      request.command === Commands.unsealWithSymmetricKey ||
      request.command === Commands.unsealWithUnsealingKey
    ) {
      // special handling for unsealing requests
      const derivationOptionsJson = request.packagedSealedMessage.derivationOptionsJson;
      const derivationOptions = DerivationOptions(derivationOptionsJson);
      this.permissionCheckedSeedAccessor.getSeedOrThrowIfClientNotAuthorizedToUnsealAsync(
        request
      )
    } else {
      // All other commands take a derivationOptionsJson parameter, which may or may note be mutable
      const derivationOptionsJson = {request}
      seedString = this.permissionCheckedSeedAccessor.getSeedOrThrowIfNotAuthorizedAsync(
        request
      )

      // Check permissions
      const derivationOptions = DerivationOptions(derivationOptionsJson);
      if (derivationOptions.mutable && !this.isUnsealingRequest(request)) {
        // mutate derivationOptions...

        // Rewrite the request to use the mutated derivation options
        // request = {...request, derivationOptionsJson: mutatedDerivationOptions};
      }
    }

    switch (request.command) {
      case Commands.generateSignature:
        return this.generateSignature(seedString)(request);
      case Commands.getPassword:
        return this.getPassword(seedString)(request);
      case Commands.getSealingKey:
        return this.getSealingKey(seedString)(request);
      case Commands.getSecret:
        return this.getSecret(seedString)(request);
      case Commands.getSignatureVerificationKey:
        return this.getSignatureVerificationKey(seedString)(request);
      case Commands.getSigningKey:
        return this.getSigningKey(seedString)(request);
      case Commands.getSymmetricKey:
        return this.getSymmetricKey(seedString)(request);
      case Commands.getPassword:
        return this.getPassword(seedString)(request);
      case Commands.sealWithSymmetricKey:
        return this.sealWithSymmetricKey(seedString)(request);
      case Commands.unsealWithSymmetricKey:
        return this.unsealWithSymmetricKey(seedString)(request);
      case Commands.unsealWithUnsealingKey:
        return this.unsealWithUnsealingKey(seedString)(request);
      default: 
        throw new Exceptions.InvalidCommand();
    }
  }

  getSecret = this.imp<ApiCalls.GetSecret>(
    (seedString, {derivationOptionsJson}) => {
      return this.seededCryptoModule.Secret.deriveFromSeed(
        seedString, derivationOptionsJson)
    }
  )

  getPassword = this.imp<ApiCalls.GetPassword>(
    (seedString, {wordLimit, derivationOptionsJson}) => {
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

  public sealWithSymmetricKey = this.imp<ApiCalls.SealWithSymmetricKey>(
    (seedString, {plaintext, unsealingInstructions, derivationOptionsJson}) =>
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
  public unsealWithSymmetricKey = this.imp<ApiCalls.UnsealWithSymmetricKey>(
    (seedString, {packagedSealedMessage}) => {
      const psm = this.seededCryptoModule.PackagedSealedMessage.fromJsObject(packagedSealedMessage);
      try {
        return this.seededCryptoModule.SymmetricKey.unseal(psm, seedString);
      } finally {
        psm.delete();
      }
    });

  public getSealingKey = this.imp<ApiCalls.GetSealingKey>(
    (seedString, {derivationOptionsJson}) =>
      this.seededCryptoModule.UnsealingKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      ).getSealingKey()
    );

  public getUnsealingKey = this.imp<ApiCalls.GetUnsealingKey>(
    (seedString, {derivationOptionsJson}) =>
      this.seededCryptoModule.UnsealingKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    );

  public getSigningKey = this.imp<ApiCalls.GetSigningKey>(
    (seedString, {derivationOptionsJson}) =>
      this.seededCryptoModule.SigningKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    );

  public getSymmetricKey = this.imp<ApiCalls.GetSymmetricKey>(
    (seedString, {derivationOptionsJson}) =>
      this.seededCryptoModule.SymmetricKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    );

  public getSignatureVerificationKey = this.imp<ApiCalls.GetSignatureVerificationKey>(
    (seedString, {derivationOptionsJson}) =>
      this.seededCryptoModule.SignatureVerificationKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    );

  public unsealWithUnsealingKey = this.imp<ApiCalls.UnsealWithUnsealingKey> (
    (seedString, {packagedSealedMessage}) => {
      const psm = this.seededCryptoModule.PackagedSealedMessage.fromJsObject(packagedSealedMessage);
      try {
        return this.seededCryptoModule.UnsealingKey.unseal(psm, seedString);
      } finally {
        psm.delete();
      }
    }
  );

  public generateSignature = this.imp<ApiCalls.GenerateSignature> (
    (seedString, {derivationOptionsJson, message}) => {
      const signingKey = this.seededCryptoModule.SigningKey.deriveFromSeed(
          seedString, derivationOptionsJson
      );
      const signatureVerificationKey = signingKey.getSignatureVerificationKey();
      try {
        const signature = signingKey.generateSignature(message);
        return {
          signature,
          signatureVerificationKey: signatureVerificationKey.toJsObject()
        };
      } finally {
        signingKey.delete();
        signatureVerificationKey.delete();
      }
    });
}