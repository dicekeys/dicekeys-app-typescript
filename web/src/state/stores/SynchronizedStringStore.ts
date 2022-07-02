import { action, makeAutoObservable } from "mobx";
import { electronBridge } from "../../state/core/ElectronBridge";

export class SynchronizedString {
  private _stringValue: string | undefined;
  get stringValue() { return this._stringValue }

  setStringValueWithoutUpdatingOthers = action ( (newValue: string | undefined) => {
    console.log(`setStringValueWithoutUpdatingOthers("${newValue}")`, this._stringValue, newValue === this._stringValue);
    if (newValue === this._stringValue) return false;
    this._stringValue = newValue;
    return true;
  });

  setStringValue = ( (newValue: string | undefined) => {
    if (this.setStringValueWithoutUpdatingOthers(newValue)) {
      // There's been a change, so update the other renderers
      this._stringValue = newValue;
      // console.log(`setSynchronizedStringState`, this.key, newValue);
      electronBridge.setSynchronizedStringState(this.key, newValue);
      }
  });

  private constructor (readonly key: string) {
    this._stringValue = electronBridge.getSynchronizedStringState(key);
    makeAutoObservable(this);
  }

  private static keyToSynchronizedString = {} as {[key: string]: SynchronizedString};
  static forKey = (key: string): SynchronizedString => {
    return SynchronizedString.keyToSynchronizedString[key] ??= new SynchronizedString(key);
  }
  static updateFromBroadcast = (key: string, newValue: string | undefined) => {
    SynchronizedString.forKey(key).setStringValueWithoutUpdatingOthers(newValue);
  }
}