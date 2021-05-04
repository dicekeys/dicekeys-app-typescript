import { action, makeAutoObservable, ObservableMap } from "mobx";
import { ComputeApiCommandWorker } from "../workers/call-api-command-worker";
import { ApiCalls, PasswordJson, SecretJson, SigningKeyJson, SymmetricKeyJson, UnsealingKeyJson } from "@dicekeys/dicekeys-api-js";
import { requestHasPackagedSealedMessageParameter, requestHasRecipeParameter } from "@dicekeys/dicekeys-api-js/dist/api-calls";
import { hexStringToUint8ClampedArray, uint8ClampedArrayToHexString } from "../utilities/convert";
import { AsyncResultObservable } from "../utilities/AsyncResultObservable";
import { AsyncCalculation } from "~utilities/AsyncCalculation";
import { toBip39 } from "~formats/bip39/bip39";

const Bip39Calculation = new AsyncCalculation<string>();

export class CachedApiCalls {
  private cache = new ObservableMap<string, AsyncResultObservable<ApiCalls.Response>>();

  private calculate = action (
      (key: string, fn: () => Promise<ApiCalls.Response>): void => {
        this.cache.set(key, new AsyncResultObservable(fn()));
      }
  );

  getResultForRecipe = <T extends ApiCalls.Request = ApiCalls.Request>(
    request: T
  ): ApiCalls.ResultForRequest<T> | undefined => {
    const key = `${request.command}:${
      requestHasRecipeParameter(request) ? (request.recipe ?? "") : 
      requestHasPackagedSealedMessageParameter(request) ? request.packagedSealedMessageJson :
      ""
    }`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!.result as ApiCalls.ResultForRequest<T>;
    }
    this.calculate(key, () => new ComputeApiCommandWorker().calculate({seedString: this.seedString, request}));
    return this.cache.get(key)?.result as (ApiCalls.ResultForRequest<T> | undefined);
  }

  // getJsonForRecipe =
  //   <R extends (ApiCalls.GetPasswordRequest | ApiCalls.GetSecretRequest | ApiCalls.GetUnsealingKeyRequest | ApiCalls.GetSymmetricKeyRequest | ApiCalls.GetSigningKeyRequest)>(
  //    command: R["command"], recipe: string
  //   ): ApiCalls.ResultForRequest<R> | undefined => {
  //   return this.getResultForRecipe<R>({command, recipe} as R)
  // }

  //
  // Passwords
  //
  getPasswordJsonForRecipe = (recipe: string): string | undefined =>
    this.getResultForRecipe({command: ApiCalls.Command.getPassword, recipe})?.passwordJson;

  getPasswordForRecipe = (recipe: string): string | undefined => {
    const passwordJson = this.getPasswordJsonForRecipe(recipe); 
    return passwordJson ? (JSON.parse(passwordJson) as PasswordJson).password : undefined;
  }

  //
  // Secrets
  getSecretJsonForRecipe = (recipe: string): string | undefined =>
    this.getResultForRecipe({command: ApiCalls.Command.getSecret, recipe})?.secretJson;

  getSecretJsonObjForRecipe = (recipe: string): SecretJson | undefined => {
    const secretJson = this.getSecretJsonForRecipe(recipe);
    return secretJson ? (JSON.parse(secretJson) as SecretJson) : undefined;
  }

  getSecretHexForRecipe = (recipe: string): string | undefined => {
    return this.getSecretJsonObjForRecipe(recipe)?.secretBytes;
  }

  getSecretBytesForRecipe = (recipe: string): Uint8ClampedArray | undefined => {
    const secretBytesHex = this.getSecretHexForRecipe(recipe);
    return secretBytesHex ? hexStringToUint8ClampedArray(secretBytesHex) : undefined;
  }

  getSecretBip39ForRecipe = (recipe: string) : string | undefined => {
    const secret = this.getSecretBytesForRecipe(recipe);
    if (secret == null) return;
    return Bip39Calculation.get( uint8ClampedArrayToHexString(secret), () => toBip39(secret) );
  }

  //
  // Signing keys
  //
  getSigningKeyJsonForRecipe = (recipe: string): string | undefined =>
  this.getResultForRecipe({command: ApiCalls.Command.getSigningKey, recipe})?.signingKeyJson;

  getSigningKeyJsonObjForRecipe = (recipe: string): SigningKeyJson | undefined => {
    const signingKey = this.getSigningKeyJsonForRecipe(recipe);
    return signingKey ? (JSON.parse(signingKey) as SigningKeyJson) : undefined;
  }

  getSigningKeyHexForRecipe = (recipe: string): string | undefined => {
    return this.getSigningKeyJsonObjForRecipe(recipe)?.signingKeyBytes;
  }

  getSigningKeyBytesForRecipe = (recipe: string): Uint8ClampedArray | undefined => {
    const signingKeyBytesHex = this.getSigningKeyHexForRecipe(recipe)
    return signingKeyBytesHex ? hexStringToUint8ClampedArray(signingKeyBytesHex) : undefined;
  }

  // getSignatureVerificationKeyHexForRecipe = (recipe: string): string | undefined => {
  //   return this.getSigningKeyJsonObjForRecipe(recipe)?.signatureVerificationKeyBytes;
  // }

  // getSignatureVerificationKeyBytesForRecipe = (recipe: string): Uint8ClampedArray | undefined => {
  //   const signatureVerificationKeyBytesHex = this.getSignatureVerificationKeyHexForRecipe(recipe)
  //   return signatureVerificationKeyBytesHex ? hexStringToUint8ClampedArray(signatureVerificationKeyBytesHex) : undefined;
  // }

  //
  // Symmetric keys
  //
  getSymmetricKeyJsonForRecipe = (recipe: string): string | undefined =>
  this.getResultForRecipe({command: ApiCalls.Command.getSymmetricKey, recipe})?.symmetricKeyJson;

  getSymmetricKeyJsonObjForRecipe = (recipe: string): SymmetricKeyJson | undefined => {
    const symmetricKeyJson = this.getSymmetricKeyJsonForRecipe(recipe);
    return symmetricKeyJson ? (JSON.parse(symmetricKeyJson) as SymmetricKeyJson) : undefined;
  }

  getSymmetricKeyHexForRecipe = (recipe: string): string | undefined => {
    return this.getSymmetricKeyJsonObjForRecipe(recipe)?.keyBytes;
  }

  getSymmetricKeyBytesForRecipe = (recipe: string): Uint8ClampedArray | undefined => {
    const symmetricKeyBytesHex = this.getSymmetricKeyHexForRecipe(recipe)
    return symmetricKeyBytesHex ? hexStringToUint8ClampedArray(symmetricKeyBytesHex) : undefined;
  }
  
  //
  // Unsealing keys
  //
  getUnsealingKeyJsonForRecipe = (recipe: string): string | undefined =>
  this.getResultForRecipe({command: ApiCalls.Command.getUnsealingKey, recipe})?.unsealingKeyJson;

  getUnsealingKeyJsonObjForRecipe = (recipe: string): UnsealingKeyJson | undefined => {
    const unsealingKeyJson = this.getUnsealingKeyJsonForRecipe(recipe);
    return unsealingKeyJson ? (JSON.parse(unsealingKeyJson) as UnsealingKeyJson) : undefined;
  }

  getUnsealingKeyHexForRecipe = (recipe: string): string | undefined => {
    return this.getUnsealingKeyJsonObjForRecipe(recipe)?.unsealingKeyBytes;
  }

  getUnsealingKeyBytesForRecipe = (recipe: string): Uint8ClampedArray | undefined => {
    const unsealingKeyBytesHex = this.getUnsealingKeyHexForRecipe(recipe)
    return unsealingKeyBytesHex ? hexStringToUint8ClampedArray(unsealingKeyBytesHex) : undefined;
  }

  getSealingKeyHexForRecipe = (recipe: string): string | undefined => {
    return this.getUnsealingKeyJsonObjForRecipe(recipe)?.sealingKeyBytes;
  }

  getSealingKeyBytesForRecipe = (recipe: string): Uint8ClampedArray | undefined => {
    const sealingKeyBytesHex = this.getSealingKeyHexForRecipe(recipe)
    return sealingKeyBytesHex ? hexStringToUint8ClampedArray(sealingKeyBytesHex) : undefined;
  }


  constructor(private seedString: string) {
    makeAutoObservable(this);
  }
}