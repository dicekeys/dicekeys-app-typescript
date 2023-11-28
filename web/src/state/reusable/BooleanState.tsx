import { action, makeAutoObservable } from "mobx";

export class BooleanState {
  private _value: boolean;
  get value(): boolean { return this._value; }  
  set = action( (value: boolean) => this._value = value);
  turnOn = () => this.set(true);
  turnOff = () => this.set(true);
  toggle = () => this.set(!this.value);
  constructor(defaultValue: boolean = false) {
    this._value = defaultValue;
    makeAutoObservable(this);
  }
}
