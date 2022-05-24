import {action, makeAutoObservable, runInAction} from "mobx";
import { ObservableLocalStorageNumber } from "./ObservableLocalStorage";
import {CustomEvent} from "./event";


export class CountdownTimer {
  // private _msRemaining: number | undefined;

  // private setMsRemaining = action( (newMsRemaining: number | undefined) => {
  //   this._msRemaining = newMsRemaining;
  // });
  readonly whenStartedMsObservable: ObservableLocalStorageNumber;
  readonly countdownLengthMsObservable: ObservableLocalStorageNumber;

  private _nowMs: number = Date.now();
  get nowMs(): number { return Math.max(this._nowMs, Date.now()); }
  private setNowMs = action( () => {
    this._nowMs = Date.now();
  });

  readonly #onReachesZero = new CustomEvent(this);

  get msCountedDown(): number | undefined {
    const msStartedMs = this.whenStartedMsObservable.value;
    const countdownLengthInMs = this.countdownLengthMsObservable.value;
    if (!Number.isFinite(countdownLengthInMs) || !Number.isFinite(msStartedMs)) return undefined;
    return Math.min(this.nowMs - msStartedMs,  countdownLengthInMs);
  }

  get msRemaining(): number | undefined {
    const countdownLengthInMs = this.countdownLengthMsObservable.value;
    const msCountedDown = this.msCountedDown;
    if (!Number.isFinite(countdownLengthInMs) || msCountedDown == null) return undefined;
    return countdownLengthInMs - msCountedDown;
  }

//  get intervalInMs() { return this.countdownLengthInMs }
  get secondsRemaining() {
    const msRemaining = this.msRemaining;
    return (msRemaining != null) ? Math.floor(msRemaining / 1000) : msRemaining;
  }

  #intervalLengthInMs: number = 500;

  #intervalId: ReturnType<typeof setInterval> | undefined;
  resetInterval = () => {
    const interval = this.#intervalId;
    const msRemaining = this.msRemaining ?? 0;
    if (interval != null && msRemaining <= 0) {
      // We have an interval we don't need, so remove it
      clearInterval(interval);
      this.#intervalId = undefined;
    }
    if (interval == null && msRemaining > 0) {    
      this.#intervalId = setInterval(this.#calledEachInterval, this.#intervalLengthInMs);
    }
  }

  clear = () => {
    this.whenStartedMsObservable.setValue(Number.NaN);
    this.resetInterval();
  }

  #calledEachInterval = () => {
    this.setNowMs();
    if ((this.msRemaining ?? 0) <= 0) {
      this.resetInterval();
      if (this.countdownLengthMsObservable.value > 0) {
        this.#onReachesZero.sendImmediately();
      }
    }
  };

  start = (startOptions: StartOptions = {}) => {
    const {
      startAtMs = 60000,
      intervalInMs = 500,
      callbackOnReachesZero
    } = startOptions;
    this.clear();
    if (callbackOnReachesZero != null) {
      this.#onReachesZero.on(callbackOnReachesZero);
    }
    runInAction(() => {
      this.countdownLengthMsObservable.setValue(startAtMs);
      this.whenStartedMsObservable.setValue(Date.now());
      this.setNowMs();  
    })
    this.#intervalLengthInMs = intervalInMs;
    this.resetInterval();
  }

  public readonly defaultStartOptions: StartOptions;
  constructor({name, startImmediately, callbackOnReachesZero, ...defaultStartOptions}: StartOptions & {name: string, startImmediately?: true}) {
    this.whenStartedMsObservable = new ObservableLocalStorageNumber(`CountdownTimer.whenStartedMsObservable:${name}`);
    this.countdownLengthMsObservable = new ObservableLocalStorageNumber(`CountdownTimer.countdownLengthInMs:${name}`);
    this.whenStartedMsObservable.changed.on( this.resetInterval );
    this.countdownLengthMsObservable.changed.on( this.resetInterval );
    this.defaultStartOptions = defaultStartOptions;
    if (callbackOnReachesZero != null) {
      this.#onReachesZero.on(callbackOnReachesZero);
    }
    if (startImmediately) {
      this.start();
    }
    this.resetInterval();
    makeAutoObservable(this);
  }
}

interface StartOptions {
  startAtMs?: number;
  intervalInMs?: number;
  callbackOnReachesZero?: () => void;
}
