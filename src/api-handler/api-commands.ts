import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise,
} from "@dicekeys/seeded-crypto-js";
import {
  DerivationOptions,
  ApiCalls,
  secretToPasswordWithSpacesBetweenWords
} from "@dicekeys/dicekeys-api-js";

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
 *          getSymmetricKey, getSigningKey, or getUnsealingKey
 * 2. If computational cost is excessive, reject the requeset
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
    seedededCryptoModule: SeededCryptoModuleWithHelpers,
    seedString: string,
    parameters: ApiCalls.ApiCallParameters<METHOD>
  ) => ApiCalls.ApiCallResult<METHOD>
) =>
  (seededCryptoModule: SeededCryptoModuleWithHelpers) =>
    (seedString: string) =>
      (parameters: ApiCalls.ApiCallParameters<METHOD>) => 
        implementation(seededCryptoModule, seedString, parameters);

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

function toJsObjectAndDelete<RESULT, T extends {delete: () => any, toJsObject: () => RESULT}>(
  derivedValue: T
): RESULT {
  return deleteAfterOperation( derivedValue, ( d ) => d.toJsObject() )
}
        
export const getSecret = implementApiCall<ApiCalls.GetSecret>(
  (seededCryptoModule, seedString, {derivationOptionsJson}) => 
    toJsObjectAndDelete( 
      seededCryptoModule.Secret.deriveFromSeed(
        seedString, derivationOptionsJson)
    )
);

export const getPassword = implementApiCall<ApiCalls.GetPassword>(
    (seededCryptoModule, seedString, {wordLimit, derivationOptionsJson}) => deleteAfterOperation(
      seededCryptoModule.Secret.deriveFromSeed(seedString, derivationOptionsJson),
      (secret) => {
        const {wordList = "en_1024_words_5_chars_max_20200709"} = DerivationOptions(derivationOptionsJson);
        const options = wordLimit != null ? {wordsNeeded: wordLimit} : {}; 
        const password = secretToPasswordWithSpacesBetweenWords( secret.secretBytes, wordList, options );
        return {password, derivationOptionsJson};
      }
    )
  )

export const sealWithSymmetricKey = implementApiCall<ApiCalls.SealWithSymmetricKey>(
  (seededCryptoModule, seedString, {plaintext, unsealingInstructions, derivationOptionsJson}) =>
    toJsObjectAndDelete(
      seededCryptoModule.SymmetricKey.sealWithInstructions(
        plaintext,
        unsealingInstructions ?? "",
        seedString,
        derivationOptionsJson
      )
    )
  );

export const unsealWithSymmetricKey = implementApiCall<ApiCalls.UnsealWithSymmetricKey>(
  (seededCryptoModule, seedString, {packagedSealedMessage}) => ({
    plaintext: deleteAfterOperation(
      seededCryptoModule.PackagedSealedMessage.fromJsObject(packagedSealedMessage),
      (packagedSealedMessageNativeObject) =>
        seededCryptoModule.SymmetricKey.unseal(packagedSealedMessageNativeObject, seedString)
    )
  })
);

export const getSealingKey = implementApiCall<ApiCalls.GetSealingKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson}) =>
    toJsObjectAndDelete(
      seededCryptoModule.UnsealingKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      ).getSealingKey()
    )
  );

export const getUnsealingKey = implementApiCall<ApiCalls.GetUnsealingKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson}) =>
    toJsObjectAndDelete(
      seededCryptoModule.UnsealingKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    )
  );

export const getSigningKey = implementApiCall<ApiCalls.GetSigningKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson}) =>
    toJsObjectAndDelete(
      seededCryptoModule.SigningKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    )
  );

export const getSymmetricKey = implementApiCall<ApiCalls.GetSymmetricKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson}) =>
    toJsObjectAndDelete(
      seededCryptoModule.SymmetricKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    )
  );

export const getSignatureVerificationKey = implementApiCall<ApiCalls.GetSignatureVerificationKey>(
  (seededCryptoModule, seedString, {derivationOptionsJson}) =>
    toJsObjectAndDelete(
      seededCryptoModule.SignatureVerificationKey.deriveFromSeed(
        seedString,
        derivationOptionsJson
      )
    )
  );

export const unsealWithUnsealingKey = implementApiCall<ApiCalls.UnsealWithUnsealingKey> (
  (seededCryptoModule, seedString, {packagedSealedMessage}) => ({
    plaintext: deleteAfterOperation(
      seededCryptoModule.PackagedSealedMessage.fromJsObject(packagedSealedMessage),
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
        signatureVerificationKey: signatureVerificationKey.toJsObject()
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
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
    seedString: string,
  ) {
    this.#seedString = seedString;
  }

  /**
   * Use ECMAscript-enforced private fields for the seedString and the
   * implementApiCall function that accessses the seedString so that
   * hose with access to this object can't extract the seedString.
   * */  
  readonly #seedString: string;

  static async create(seedString: string) {
    return new SeededApiCommands(await SeededCryptoModulePromise, seedString);
  }

  generateSignature = generateSignature(this.seededCryptoModule)(this.#seedString);
  getSealingKey = getSealingKey(this.seededCryptoModule)(this.#seedString);
  getUnsealingKey = getUnsealingKey(this.seededCryptoModule)(this.#seedString);
  getSecret = getSecret(this.seededCryptoModule)(this.#seedString);
  getSignatureVerificationKey = getSignatureVerificationKey(this.seededCryptoModule)(this.#seedString);
  getSigningKey = getSigningKey(this.seededCryptoModule)(this.#seedString);
  getSymmetricKey = getSymmetricKey(this.seededCryptoModule)(this.#seedString);
  getPassword = getPassword(this.seededCryptoModule)(this.#seedString);
  sealWithSymmetricKey = sealWithSymmetricKey(this.seededCryptoModule)(this.#seedString);
  unsealWithSymmetricKey = unsealWithSymmetricKey(this.seededCryptoModule)(this.#seedString);
  unsealWithUnsealingKey = unsealWithUnsealingKey(this.seededCryptoModule)(this.#seedString);
}
