import {action, makeAutoObservable} from "mobx";
import {CustomEvent} from "./event";


export class CountdownTimer {
  private _msRemaining: number | undefined;

  private setMsRemaining = action( (newMsRemaining: number | undefined) => {
    this._msRemaining = newMsRemaining;
  });

  readonly #onReachesZero = new CustomEvent(this);
  #intervalInMs: number | undefined;

  get msRemaining() { return this._msRemaining }
  get intervalInMs() { return this.#intervalInMs }
  get secondsRemaining() {
    const msRemaining = this.msRemaining;
    return (msRemaining != null) ? msRemaining / 1000 : msRemaining;
  }

  #intervalId: ReturnType<typeof setInterval> | undefined;
  clear = () => {
    const interval = this.#intervalId;
    if (interval != null) {
      clearInterval(interval);
      this.#intervalId = undefined;
      this.setMsRemaining(undefined);
    }
  }

  #calledEachInterval = () => {
    const {msRemaining, intervalInMs} = this;
    if (msRemaining == null || msRemaining <= 0 || intervalInMs == null || intervalInMs <= 0)
      return;
    const newMsRemaining = Math.max(msRemaining - intervalInMs, 0);
    this.setMsRemaining(newMsRemaining);
    if (newMsRemaining <= 0) {
      this.clear();
      this.#onReachesZero.send();
    }
  };

  start = (startOptions: StartOptions = {}) => {
    const {
      startAtMs = 60000,
      intervalInMs = 1000,
      callbackOnReachesZero
    } = startOptions;
    this.clear();
    if (callbackOnReachesZero != null) {
      this.#onReachesZero.on(callbackOnReachesZero);
    }
    this.#intervalInMs = intervalInMs;
    this._msRemaining = startAtMs;
    this.#intervalId = setInterval(this.#calledEachInterval, intervalInMs);
  }

  public readonly defaultStartOptions: StartOptions;
  constructor({startImmediately, callbackOnReachesZero, ...defaultStartOptions}: StartOptions & {startImmediately?: true} = {}) {
    this.defaultStartOptions = defaultStartOptions;
    if (callbackOnReachesZero != null) {
      this.#onReachesZero.on(callbackOnReachesZero);
    }
    if (startImmediately) {
      this.start();
    }
    makeAutoObservable(this);
  }
}

interface StartOptions {
  startAtMs?: number;
  intervalInMs?: number;
  callbackOnReachesZero?: () => void;
}