import { makeObservable, observable, runInAction } from "mobx";
import { UnknownValueCaughtByCatch } from "./exceptions";

export class AsyncResultObservable<T> {
  result?: T = undefined;
  exception?: UnknownValueCaughtByCatch = undefined;

  constructor(promise: Promise<T>) {
    makeObservable(this, {
      result: observable,
      exception: observable,
    });
    promise
      .then( (result) => runInAction( () => this.result = result ))
      .catch( (exception) => runInAction( () => this.exception = exception ))
  }
}
