import { action, makeAutoObservable } from "mobx";

export class BooleanState {
  private _value: boolean = false
  get value(): boolean { return this._value; }  
  set = action( (value: boolean) => this._value = value);
  turnOn = () => this.set(true);
  turnOff = () => this.set(true);
  toggle = () => this.set(!this.value);
  constructor() {
    makeAutoObservable(this);
  }
}
