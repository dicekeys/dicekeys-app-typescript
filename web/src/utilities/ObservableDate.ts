import {action, makeAutoObservable} from "mobx";

export class ObservableDate {
  private _now: number;
  
  get now(): number { return this._now; }
  update = action( () => {
    this._now = Date.now();
  })
  
  constructor(updateFrequencyInMs: number = 100) {
    this._now = Date.now();
    makeAutoObservable(this);
    setInterval(this.update, updateFrequencyInMs);
  }
}
export const ObservableDateUpdatedEvery100ms = new ObservableDate();