import { action, makeAutoObservable, ObservableMap } from "mobx";
import { AsyncResultObservable } from "./AsyncResultObservable";

export class AsyncCalculation<RESULT, KEY=string> {
  private cache = new ObservableMap<KEY, AsyncResultObservable<RESULT>>();

  private set = action (
    (key: KEY, promise: Promise<RESULT>): void => {
      this.cache.set(key, new AsyncResultObservable(promise));
  });

  private calculate = (key: KEY, fn: () => Promise<RESULT>): void => {
    this.set(key, fn());
  }

  public get = (
    key: KEY, fn: () => Promise<RESULT>
  ): RESULT | undefined => {
    if (this.cache.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.cache.get(key)!.result as RESULT;
    }
    this.calculate(key, fn);
    return this.cache.get(key)?.result;
  }

  constructor() {
    makeAutoObservable(this);
  }
}