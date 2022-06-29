import { makeAutoObservable, runInAction } from "mobx";
import { Caught } from "./exceptions";

export class MobxObservedPromise<T> {
  private _fulfilled: boolean = false;
  get fulfilled() { return this._fulfilled }
  private _result: T | undefined = undefined;
  get result() { return this._result }
  private _error: Caught = undefined;
  get error() { return this._error }

  constructor(promise: Promise<T>) {
    promise.then( result => runInAction(() => {
      this._result = result;
      this._fulfilled = true;
    })).catch( error => runInAction(() => {
      this._error = error;
      this._fulfilled = true;
    }));
    makeAutoObservable(this);
  }
}