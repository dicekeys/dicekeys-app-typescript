import { action, makeAutoObservable, ObservableMap } from "mobx";
import { ComputeApiCommandWorker } from "../workers/call-api-command-worker";
import { ApiCalls, PasswordJson } from "@dicekeys/dicekeys-api-js";
import { requestHasPackagedSealedMessageParameter, requestHasRecipeParameter } from "@dicekeys/dicekeys-api-js/dist/api-calls";

export class CachedApiCalls {
  private cache = new ObservableMap<string, {result: ApiCalls.ApiCallResult | undefined}>();

  private createEntryForResult = action ( (
    key: string
  ) => {
    this.cache.set(key, makeAutoObservable({result: undefined}));
  });

  private setResult = action( <T extends ApiCalls.Request = ApiCalls.Request>(
    key: string,
    result: ApiCalls.ResultForRequest<T> | undefined
  ) => {
    this.cache.get(key)!.result = result;
  });

  getResultForRecipe = <T extends ApiCalls.Request = ApiCalls.Request>(
    request: T
  ): ApiCalls.ResultForRequest<T> | undefined => {
    const key = `${request.command}:${
      requestHasRecipeParameter(request) ? (request.recipe ?? "") : 
      requestHasPackagedSealedMessageParameter(request) ? request.packagedSealedMessageJson :
      ""
    }`;
    if (this.cache.has(key)) {
      return (this.cache.get(key) as {result?: ApiCalls.ResultForRequest<T>}).result;
    }
    this.createEntryForResult(key);
    new ComputeApiCommandWorker().calculate({seedString: this.seedString, request}).then( result => {
      if ("exception" in result) {
        // this.throwException(result.exception, "calculating a password");
      } else {
        console.log(`setResult ${key} ${result}`)
        this.setResult<T>(key, result as ApiCalls.ResultForRequest<T>);
      }
    }).catch( e => {
      console.log(`Exception in API command worker ${e}`);
    });
    return this.cache.get(key)?.result as (ApiCalls.ResultForRequest<T> | undefined);
  }

  getPasswordForRecipe = (recipe: string): string | undefined => {
    const apiResponse = this.getResultForRecipe({
      command: ApiCalls.Command.getPassword,
      recipe
    } as ApiCalls.GetPasswordRequest);
    return apiResponse && apiResponse.passwordJson ? (JSON.parse(apiResponse.passwordJson) as PasswordJson).password : undefined;
  }

  constructor(private seedString: string) {
    makeAutoObservable(this);
  }
}