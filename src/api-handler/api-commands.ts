import {
  SeededCryptoModuleWithHelpers,
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
 *     b. if the recipe doesn't include clientMayRetrieveKey and the request is
 *          getSymmetricKey,
 * getSigningKey, or getUnsealingKey
 * 2. If computational cost is excessive, reject the request
 *        later we can implement preview of request with warning and have worker calculate in background
 * 3. Calculate the result ahead of time for getPassword or unseal operations
 * 4. Ask the user to approve the command and (if appropriate) to mutate the recipe
 *   - Handle any warning requests in the Unsealing Options
 *   - Offer request context if appropriate (message being sealed, signed)
 *   - Offer preview of result if appropriate (password, unsealed message)
 *   - For getPassword, the preview must update if user mutates recipe 
 * 5. If user approves
 *      a. Calculate the result with any modifications to the recipe made by user
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
  (seededCryptoModule, seedString, {recipe = ""}) => ({
    [GetSecretSuccessResponseParameterNames.secretJson]:
      toJsonAndDelete( 
        seededCryptoModule.Secret.deriveFromSeed(seedString, recipe)
  )}));

export const getPassword = implementApiCall<ApiCalls.GetPassword>(
    (seededCryptoModule, seedString, {recipe = ""}) => ({
      [GetPasswordSuccessResponseParameterNames.passwordJson]:
        toJsonAndDelete( 
          seededCryptoModule.Password.deriveFromSeed(seedString, recipe)
    )}));

export const sealWithSymmetricKey = implementApiCall<ApiCalls.SealWithSymmetricKey>(
  (seededCryptoModule, seedString, {plaintext, unsealingInstructions = "", recipe = ""}) => ({
      [SealWithSymmetricKeySuccessResponseParameterNames.packagedSealedMessageJson]:
      toJsonAndDelete(
          seededCryptoModule.SymmetricKey.sealWithInstructions(
            plaintext,
            unsealingInstructions,
            seedString,
            recipe
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
  (seededCryptoModule, seedString, {recipe = ""}) => ({
    [GetSealingKeySuccessResponseParameterNames.sealingKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.UnsealingKey.deriveFromSeed(
          seedString,
          recipe
        ).getSealingKey()
      )
    })
  );

export const getUnsealingKey = implementApiCall<ApiCalls.GetUnsealingKey>(
  (seededCryptoModule, seedString, {recipe = ""}) => ({
    [GetUnsealingKeySuccessResponseParameterNames.unsealingKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.UnsealingKey.deriveFromSeed(
          seedString,
          recipe
        )
      )
    })
  );

export const getSigningKey = implementApiCall<ApiCalls.GetSigningKey>(
  (seededCryptoModule, seedString, {recipe = ""}) => ({
    [GetSigningKeySuccessResponseParameterNames.signingKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.SigningKey.deriveFromSeed(
          seedString,
          recipe
        )
      )
    })
  );

export const getSymmetricKey = implementApiCall<ApiCalls.GetSymmetricKey>(
  (seededCryptoModule, seedString, {recipe = ""}) => ({
    [GetSymmetricKeySuccessResponseParameterNames.symmetricKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.SymmetricKey.deriveFromSeed(
          seedString,
          recipe
        )
      )
    })
  );

export const getSignatureVerificationKey = implementApiCall<ApiCalls.GetSignatureVerificationKey>(
  (seededCryptoModule, seedString, {recipe = ""}) => ({
    [GetSignatureVerificationKeySuccessResponseParameterNames.signatureVerificationKeyJson]:
      toJsonAndDelete(
        seededCryptoModule.SignatureVerificationKey.deriveFromSeed(
          seedString,
          recipe
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
  (seededCryptoModule, seedString, {recipe, message}) => {
    const signingKey = seededCryptoModule.SigningKey.deriveFromSeed(
        seedString, recipe
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

