import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise,
} from "@dicekeys/seeded-crypto-js";
import {
  ApiCalls
} from "@dicekeys/dicekeys-api-js";
import {
  GetPasswordSuccessResponseParameterNames,
  GetSealingKeySuccessResponseParameterNames,
  GetSecretSuccessResponseParameterNames,
  GetSignatureVerificationKeySuccessResponseParameterNames,
  GetSigningKeySuccessResponseParameterNames,
  GetSymmetricKeySuccessResponseParameterNames,
  GetUnsealingKeySuccessResponseParameterNames,
  SealWithSymmetricKeySuccessResponseParameterNames,
  UnsealWithSymmetricKeySuccessResponseParameterNames
} from "@dicekeys/dicekeys-api-js/dist/api-calls";


/**
 * API Pipeline
 * 
 *    Offer additional information if appropriate (message being sealed, signed)
 * 
 * PostMessage
 * 1. Client opens window in DiceKeys app 
 * 2. Window responds with Ready messages
 * 3. DiceKeys app processes request and sends response
 * 4. DiceKeys app closes window after short delay
 * 
 * URL
 * ...
 * 
 * DiceKeys App Request Processing Pipeline
 *
 * 1. Reject request if it is forbidden
 *     a. if the requesting client is not allowed to make the request (e.g. domain not on hosts list)
 *     b. if the derivation options don't include clientMayRetrieveKey and the request is
 *          getSymmetricKey,
 * getSigningKey, or getUnsealingKey
 * 2. If computational cost is excessive, reject the request
 *        later we can implement preview of request with warning and have worker calculate in background
 * 3. Calculate the result ahead of time for getPassword or unseal operations
 * 4. Ask the user to approve the command and (if appropriate) to mutate the derivation options
 *   - Handle any warning requests in the Unsealing Options
 *   - Offer request context if appropriate (message being sealed, signed)
 *   - Offer preview of result if appropriate (password, unsealed message)
 *   - For getPassword, the preview must update if user mutates derivation options 
 * 5. If user approves
 *      a. Calculate the result with any modifications to the derivation options made by user
 *      b. Transmit result
 * 6. If user declines, send exception indicating decline
 * 
 */



/**
 * 
 * @param implementation 
 * 
 * 
 */

const implementApiCall = <METHOD extends ApiCalls.ApiCall>(
  implementation: (
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    seedString: string,
    parameters: METHOD["parameters"]
  ) => ApiCalls.ApiCallResult<METHOD>
) =>
  (seededCryptoModule: SeededCryptoModuleWithHelpers) =>
    (seedString: string) =>
      (request: METHOD["parameters"]) => {
        try {
          return implementation(seededCryptoModule, seedString, request);
        } catch (e) {
          if (typeof e === "number") {
            // The seeded crypto library will throw exception pointers which need
            // to be converted back into strings.
            throw new Error(seededCryptoModule.getExceptionMessage(e));
          } else {
            throw e;
          }
        }
      }

function deleteAfterOperation<DELETABLE extends {delete: () => any}, RESULT>(
  deletable: DELETABLE,
  callback: (d: DELETABLE) => RESULT
): RESULT {
  try {
    return callback(deletable);
  } finally {
    deletable.delete();
  }
}

function toJsonAndDelete<RESULT, T extends {delete: () => any, toJson: () => RESULT}>(
  derivedValue: T
): RESULT {
  return deleteAfterOperation( derivedValue, ( d ) => d.toJson() )
}

export const getSecret = implementApiCall<ApiCalls.GetSecret>(
  (seededCryptoModule, seedString, {derivationOptionsJson = ""}) => ({
    [GetSecretSuccessResponseParameterNames.secretJson]:
      toJsonAndDelete( 
        seededCryptoModule.Secret.deriveFromSeed(seedString, derivationOptionsJson)
  )}));

export const getPassword = implementApiCall<ApiCalls.GetPassword>(
    (seededCryptoModule, seedString, {derivationOptionsJson = ""}) => ({
      [GetPasswordSuccessResponseParameterNames.passwordJson]:
        toJsonAndDelete( 
          seededCryptoModule.Password.deriveFromSeed(seedString, derivationOptionsJson)
    )}));

export const sealWithSymmetricKey = implementApiCall<ApiCalls.SealWithSymmetricKey>(
  (seededCryptoModule, seedString, {plaintext, unsealingInstructions = "", derivationOptionsJson = ""}) => ({
      [SealWithSymmetricKeySuccessResponseParameterNames.packagedSealedMessageJson]:
      toJsonAndDelete(
          seededCryptoModule.SymmetricKey.sealWithInstructions(
            plaintext,
            unsealingInstructions,
            seedString,
            derivationOptionsJson
          )
      )
    })
  );

export const unsealWithSymmetricKey = implementApiCall<ApiCalls.UnsealWithSymmetricKey>(
  (seededCryptoModule, seedString, {packagedSealedMessageJson}) => ({
    [UnsealWithSymmetricKeySuccessResponseParameterNames.plaintext]: deleteAfterOperation(
      seededCryptoModule.PackagedSealedMessage.fromJson(packagedSealedMessageJson),
      (packagedSealedMessageNativeObject) =>
        seededCryptoModule.SymmetricKey.unseal(packagedSealedMessageNativeObject, seedString)
    )
  })
);

export const getSealingKey = implementApiCall<ApiCalls.GetSealingKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson = ""}) => ({
    [GetSealingKeySuccessResponseParameterNames.sealingKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.UnsealingKey.deriveFromSeed(
          seedString,
          derivationOptionsJson
        ).getSealingKey()
      )
    })
  );

export const getUnsealingKey = implementApiCall<ApiCalls.GetUnsealingKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson = ""}) => ({
    [GetUnsealingKeySuccessResponseParameterNames.unsealingKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.UnsealingKey.deriveFromSeed(
          seedString,
          derivationOptionsJson
        )
      )
    })
  );

export const getSigningKey = implementApiCall<ApiCalls.GetSigningKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson = ""}) => ({
    [GetSigningKeySuccessResponseParameterNames.signingKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.SigningKey.deriveFromSeed(
          seedString,
          derivationOptionsJson
        )
      )
    })
  );

export const getSymmetricKey = implementApiCall<ApiCalls.GetSymmetricKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson = ""}) => ({
    [GetSymmetricKeySuccessResponseParameterNames.symmetricKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.SymmetricKey.deriveFromSeed(
          seedString,
          derivationOptionsJson
        )
      )
    })
  );

export const getSignatureVerificationKey = implementApiCall<ApiCalls.GetSignatureVerificationKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson = ""}) => ({
    [GetSignatureVerificationKeySuccessResponseParameterNames.signatureVerificationKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.SignatureVerificationKey.deriveFromSeed(
          seedString,
          derivationOptionsJson
        )
      )
    })
  );

export const unsealWithUnsealingKey = implementApiCall<ApiCalls.UnsealWithUnsealingKey> (
  (seededCryptoModule, seedString, {packagedSealedMessageJson}) => ({
    plaintext: deleteAfterOperation(
      seededCryptoModule.PackagedSealedMessage.fromJson(packagedSealedMessageJson),
      (packagedSealedMessageNativeObject) =>
        seededCryptoModule.UnsealingKey.unseal(packagedSealedMessageNativeObject, seedString)
    )
  })
);

export const generateSignature = implementApiCall<ApiCalls.GenerateSignature> (
  (seededCryptoModule, seedString, {derivationOptionsJson, message}) => {
    const signingKey = seededCryptoModule.SigningKey.deriveFromSeed(
        seedString, derivationOptionsJson
    );
    const signatureVerificationKey = signingKey.getSignatureVerificationKey();
    try {
      const signature = signingKey.generateSignature(message);
      return {
        signature,
        signatureVerificationKeyJson: signatureVerificationKey.toJson()
      };
    } finally {
      signingKey.delete();
      signatureVerificationKey.delete();
    }
  });

/**
 * Implements the server-side API calls
 *
 * Internally, this class does not have access to the user's raw seeds (DiceKeys).
 * Rather, the commands are to be seeded only after permission checks are complete.
 *
 * The caller is responsible for catching exceptions
 */
export class SeededApiCommands {
  public generateSignature;
  public getSealingKey;
  public getUnsealingKey;
  public getSecret;
  public getSignatureVerificationKey;
  public getSigningKey;
  public getSymmetricKey;
  public getPassword;
  public sealWithSymmetricKey;
  public unsealWithSymmetricKey;
  public unsealWithUnsealingKey;
  
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
    seedString: string,
  ) {
    seedString = seedString;
    this.generateSignature = generateSignature(this.seededCryptoModule)(seedString);
    this.getSealingKey = getSealingKey(this.seededCryptoModule)(seedString);
    this.getUnsealingKey = getUnsealingKey(this.seededCryptoModule)(seedString);
    this.getSecret = getSecret(this.seededCryptoModule)(seedString);
    this.getSignatureVerificationKey = getSignatureVerificationKey(this.seededCryptoModule)(seedString);
    this.getSigningKey = getSigningKey(this.seededCryptoModule)(seedString);
    this.getSymmetricKey = getSymmetricKey(this.seededCryptoModule)(seedString);
    this.getPassword = getPassword(this.seededCryptoModule)(seedString);
    this.sealWithSymmetricKey = sealWithSymmetricKey(this.seededCryptoModule)(seedString);
    this.unsealWithSymmetricKey = unsealWithSymmetricKey(this.seededCryptoModule)(seedString);
    this.unsealWithUnsealingKey = unsealWithUnsealingKey(this.seededCryptoModule)(seedString);
  }

  static async create(seedString: string) {
    return new SeededApiCommands(await SeededCryptoModulePromise, seedString);
  }

}
