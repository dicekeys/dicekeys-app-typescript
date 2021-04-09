import { action, makeAutoObservable, ObservableMap } from "mobx";
import { ComputeApiCommandWorker } from "../workers/call-api-command-worker";
import { ApiCalls, PasswordJson, SecretJson } from "@dicekeys/dicekeys-api-js";
import { requestHasPackagedSealedMessageParameter, requestHasRecipeParameter } from "@dicekeys/dicekeys-api-js/dist/api-calls";
import { hexStringToUint8ClampedArray } from "../utilities/convert";

export class AsyncResultObservable<T> {
  result?: T = undefined;
  exception?: any = undefined;

  constructor(fn: () => Promise<T>) {
    makeAutoObservable(this);
    fn()
      .then( (result) => this.result = result )
      .catch( (exception) => this.exception = exception );
  }
}

export class CachedApiCalls {
  private cache = new ObservableMap<string, AsyncResultObservable<ApiCalls.Response>>();

  private calculate = action (
      (key: string, fn: () => Promise<ApiCalls.Response>): void => {
        this.cache.set(key, new AsyncResultObservable(fn));
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

  getJsonForRecipe =
    <R extends (ApiCalls.GetPasswordRequest | ApiCalls.GetSecretRequest | ApiCalls.GetUnsealingKeyRequest | ApiCalls.GetSymmetricKeyRequest | ApiCalls.GetSigningKeyRequest)>(
     command: R["command"], recipe: string
    ): ApiCalls.ResultForRequest<R> | undefined => {
    return this.getResultForRecipe<R>({command, recipe} as R)
  }

  getPasswordJsonForRecipe = (recipe: string): string | undefined =>
    this.getResultForRecipe({command: ApiCalls.Command.getPassword, recipe})?.passwordJson;

  getPasswordForRecipe = (recipe: string): string | undefined => {
    const passwordJson = this.getPasswordJsonForRecipe(recipe); 
    return passwordJson ? (JSON.parse(passwordJson) as PasswordJson).password : undefined;
  }

  getSecretJsonForRecipe = (recipe: string): string | undefined =>
    this.getResultForRecipe({command: ApiCalls.Command.getSecret, recipe})?.secretJson;

  getSecretJsonObjForRecipe = (recipe: string): SecretJson | undefined => {
    const secretJson = this.getSecretJsonForRecipe(recipe);
    return secretJson ? (JSON.parse(secretJson) as SecretJson) : undefined;
  }

  getSecretBytesForRecipe = (recipe: string): Uint8ClampedArray | undefined => {
    const secretBytesHex = this.getSecretJsonObjForRecipe(recipe)?.secretBytes;
    return secretBytesHex ? hexStringToUint8ClampedArray(secretBytesHex) : undefined;
  }

  getSymmetricKeyJsonForRecipe = (recipe: string): string | undefined =>
  this.getResultForRecipe({command: ApiCalls.Command.getSymmetricKey, recipe})?.symmetricKeyJson;

  getUnsealingKeyJsonForRecipe = (recipe: string): string | undefined =>
  this.getResultForRecipe({command: ApiCalls.Command.getUnsealingKey, recipe})?.unsealingKeyJson;

  constructor(private seedString: string) {
    makeAutoObservable(this);
  }
}