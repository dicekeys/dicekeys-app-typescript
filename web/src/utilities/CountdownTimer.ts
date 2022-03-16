import {action, makeAutoObservable} from "mobx";
import {CustomEvent} from "./event";

export class CountdownTimer {
  private _msRemaining: number = 0;
  get msRemaining() { return this._msRemaining }
  get secondsRemaining() { return this._msRemaining / 1000 }

  readonly onReachesZero = new CustomEvent(this);

  readonly #intervalToClearWhenDone: ReturnType<typeof setInterval>;  
  clear = () => {
    clearInterval(this.#intervalToClearWhenDone);
  }

  #calledEachInterval = action( () => {
    this._msRemaining = Math.max(this._msRemaining - this.intervalInMs, 0);
    if (this._msRemaining <= 0) {
      this.clear();
      this.onReachesZero.send();
    }
  });

  constructor(public readonly startAtMs: number, public readonly intervalInMs: number = 1000) {
    this._msRemaining = startAtMs;
    makeAutoObservable(this);
    this.#intervalToClearWhenDone = setInterval(this.#calledEachInterval, intervalInMs);
  }
}