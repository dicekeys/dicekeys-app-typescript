import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
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

import {
  ApiCalls,
  Exceptions,
} from "@dicekeys/dicekeys-api-js";

function deleteAfterOperation<DELETABLE extends {delete: () => void}, RESULT>(
  deletable: DELETABLE,
  callback: (d: DELETABLE) => RESULT
): RESULT {
  try {
    return callback(deletable);
  } finally {
    deletable.delete();
  }
}

function toJsonAndDelete<RESULT, T extends {delete: () => void, toJson: () => RESULT}>(
  derivedValue: T
): RESULT {
  return deleteAfterOperation( derivedValue, ( d ) => d.toJson() )
}

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
   * Use ECMAScript-enforced private fields for the seedString and the
   * this.wrapApiCall function that accesses the seedString so that
   * hose with access to this object can't extract the seedString.
   * */  
  readonly #seedString: string;

  static async create(seedString: string) {
    return new SeededApiCommands(await SeededCryptoModulePromise, seedString);
  }

  private wrapApiCall = <METHOD extends ApiCalls.ApiCall>(
    implementation: (
      parameters: METHOD["parameters"]
    ) => ApiCalls.ApiCallResult<METHOD>
  ) => (request: METHOD["parameters"]) => {
    try {
      return implementation(request);
    } catch (e) {
      if (typeof e === "number") {
        // The seeded crypto library will throw exception pointers which need
        // to be converted back into strings.
        throw new Error(this.seededCryptoModule.getExceptionMessage(e));
      } else {
        throw e;
      }
    }
  }

  getSecret = this.wrapApiCall<ApiCalls.GetSecret>(
    ({recipe = ""}) => ({
      [GetSecretSuccessResponseParameterNames.secretJson]:
        toJsonAndDelete( 
          this.seededCryptoModule.Secret.deriveFromSeed(this.#seedString, recipe)
    )}));

  getPassword = this.wrapApiCall<ApiCalls.GetPassword>(
    ({recipe = ""}) => ({
      [GetPasswordSuccessResponseParameterNames.passwordJson]:
        toJsonAndDelete( 
          this.seededCryptoModule.Password.deriveFromSeed(this.#seedString, recipe)
    )}));

  sealWithSymmetricKey = this.wrapApiCall<ApiCalls.SealWithSymmetricKey>(
    ({plaintext, unsealingInstructions = "", recipe = ""}) => ({
      [SealWithSymmetricKeySuccessResponseParameterNames.packagedSealedMessageJson]:
      toJsonAndDelete(
          this.seededCryptoModule.SymmetricKey.sealWithInstructions(
            plaintext,
            unsealingInstructions,
            this.#seedString,
            recipe
          )
        )
      })
  );

  unsealWithSymmetricKey = this.wrapApiCall<ApiCalls.UnsealWithSymmetricKey>(
    ({packagedSealedMessageJson}) => ({
      [UnsealWithSymmetricKeySuccessResponseParameterNames.plaintext]: deleteAfterOperation(
        this.seededCryptoModule.PackagedSealedMessage.fromJson(packagedSealedMessageJson),
        (packagedSealedMessageNativeObject) =>
          this.seededCryptoModule.SymmetricKey.unseal(packagedSealedMessageNativeObject, this.#seedString)
        )
      })
  );

  getSealingKey = this.wrapApiCall<ApiCalls.GetSealingKey>(
    ({recipe = ""}) => ({
      [GetSealingKeySuccessResponseParameterNames.sealingKeyJson]:
        toJsonAndDelete(
          this.seededCryptoModule.UnsealingKey.deriveFromSeed(
            this.#seedString,
            recipe
          ).getSealingKey()
        )
     })
  );

  getUnsealingKey = this.wrapApiCall<ApiCalls.GetUnsealingKey>(
    ({recipe = ""}) => ({
      [GetUnsealingKeySuccessResponseParameterNames.unsealingKeyJson]:
        toJsonAndDelete(
          this.seededCryptoModule.UnsealingKey.deriveFromSeed(
            this.#seedString,
            recipe
          )
        )
      })
  );

  getSigningKey = this.wrapApiCall<ApiCalls.GetSigningKey>(
    ({recipe = ""}) => ({
      [GetSigningKeySuccessResponseParameterNames.signingKeyJson]:
        toJsonAndDelete(
          this.seededCryptoModule.SigningKey.deriveFromSeed(
            this.#seedString,
            recipe
          )
        )
      })
  );

  getSymmetricKey = this.wrapApiCall<ApiCalls.GetSymmetricKey>(
    ({recipe = ""}) => ({
      [GetSymmetricKeySuccessResponseParameterNames.symmetricKeyJson]:
        toJsonAndDelete(
          this.seededCryptoModule.SymmetricKey.deriveFromSeed(
            this.#seedString,
            recipe
          )
        )
      })
  );

  getSignatureVerificationKey = this.wrapApiCall<ApiCalls.GetSignatureVerificationKey>(
  ({recipe = ""}) => ({
    [GetSignatureVerificationKeySuccessResponseParameterNames.signatureVerificationKeyJson]:
      toJsonAndDelete(
        this.seededCryptoModule.SignatureVerificationKey.deriveFromSeed(
          this.#seedString,
          recipe
        )
      )
    })
  );

  unsealWithUnsealingKey = this.wrapApiCall<ApiCalls.UnsealWithUnsealingKey> (
    ({packagedSealedMessageJson}) => ({
      plaintext: deleteAfterOperation(
        this.seededCryptoModule.PackagedSealedMessage.fromJson(packagedSealedMessageJson),
        (packagedSealedMessageNativeObject) =>
          this.seededCryptoModule.UnsealingKey.unseal(packagedSealedMessageNativeObject, this.#seedString)
      )
    })
  );

  generateSignature = this.wrapApiCall<ApiCalls.GenerateSignature> (
    ({recipe, message}) => {
      const signingKey = this.seededCryptoModule.SigningKey.deriveFromSeed(
          this.#seedString, recipe
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
    }
  );

  executeRequest = <REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject>(
    request: REQUEST & ApiCalls.ApiRequestObject
  ): ApiCalls.ResultForRequest<REQUEST> => {
    switch (request.command) {
      case ApiCalls.Command.generateSignature:
        return this.generateSignature(request);
      case ApiCalls.Command.getPassword:
        return this.getPassword(request);
      case ApiCalls.Command.getSealingKey:
        return this.getSealingKey(request);
      case ApiCalls.Command.getSecret:
        return this.getSecret(request);
      case ApiCalls.Command.getSignatureVerificationKey:
        return this.getSignatureVerificationKey(request);
      case ApiCalls.Command.getSigningKey:
        return this.getSigningKey(request);
      case ApiCalls.Command.getSymmetricKey:
        return this.getSymmetricKey(request);
      case ApiCalls.Command.getUnsealingKey:
        return this.getUnsealingKey(request);
      case ApiCalls.Command.sealWithSymmetricKey:
        return this.sealWithSymmetricKey(request);
      case ApiCalls.Command.unsealWithSymmetricKey:
        return this.unsealWithSymmetricKey(request);
      case ApiCalls.Command.unsealWithUnsealingKey:
        return this.unsealWithUnsealingKey(request);
      default: 
        throw new Exceptions.InvalidCommand();
    }
  }
}
