import { action, makeAutoObservable } from "mobx";
import { autoSave } from "./core";

export class GlobalSharedToggleState {
  value: boolean;

  toggle = action ( () => {
    this.value = !this.value;
  })

  constructor(name: string, defaultValue: boolean = false) {
    this.value = defaultValue
    makeAutoObservable(this);
    autoSave(this, `GlobalSharedToggleState:${name}`)
  }
}

export const ObscureDiceKey = new GlobalSharedToggleState("SecretFieldsCommonObscureState", true);
export const ObscureSecretFields = new GlobalSharedToggleState("SecretFieldsCommonObscureState", true);