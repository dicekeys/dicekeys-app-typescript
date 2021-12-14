import { action, makeAutoObservable } from "mobx";
import { autoSave } from "./core";

export interface ToggleState {
  value: boolean;
  toggle: () => void;
}

type ToggleStateChangeListener = (newValue: boolean) => any;

export class GlobalSharedToggleState implements ToggleState {
  value: boolean;

  #changeListeners: Set<ToggleStateChangeListener> = new Set();

  onChange = (changeListener: ToggleStateChangeListener) => {
    this.#changeListeners.add(changeListener);
    return (() => {this.#changeListeners.delete(changeListener)});
  }

  set = action ( (newValue: boolean) => {
    if (this.value !== newValue) {
      this.value = newValue;
      [...this.#changeListeners].forEach( listener => { try { listener(newValue); } catch {} });
    }
  });

  toggle = () => this.set(!this.value);

  constructor(name: string, defaultValue: boolean = false) {
    this.value = defaultValue
    makeAutoObservable(this);
    autoSave(this, `GlobalSharedToggleState:${name}`)
  }
}

export const ObscureDiceKey = new GlobalSharedToggleState("SecretFieldsCommonObscureState", true);
export const ObscureSecretFields = new GlobalSharedToggleState("SecretFieldsCommonObscureState", true);

// The decision to hide a DiceKey should also hide all values derived from it
// until a user decides to override that choice.
ObscureDiceKey.onChange( newValue => {
  if (newValue) {
    ObscureSecretFields.set(true);
  }
} );