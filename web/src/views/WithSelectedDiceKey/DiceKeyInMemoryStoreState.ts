import { DiceKey, DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../../state";
import { action, makeAutoObservable } from "mobx";
import { GetSetDiceKey } from "./GetSetDiceKey";


export class DiceKeyInMemoryStoreState implements GetSetDiceKey {

  private _keyId: string | undefined;
  get keyId() { return this._keyId != null && DiceKeyMemoryStore.hasKeyIdInMemory(this._keyId) ? this._keyId : undefined; }
  readonly getDiceKey = () => this.keyId != null ? DiceKeyMemoryStore.diceKeyForKeyId(this.keyId) : undefined;

  //  get diceKey() { return this.getDiceKey(); }
  readonly setKeyId = action((keyId: string | undefined) => {
    this._keyId = keyId;
  });

  readonly setDiceKey = async (diceKey: DiceKey | undefined) => {
    if (diceKey == null) {
      this.setKeyId(undefined);
    } else {
      const diceKeyWithKeyId = diceKey instanceof DiceKeyWithKeyId ? diceKey : await diceKey.withKeyId;
      DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKeyWithKeyId);
      this.setKeyId(diceKeyWithKeyId.keyId);
    }
  };

  get getSetDiceKey(): GetSetDiceKey {
    return {
      getDiceKey: this.getDiceKey,
      setDiceKey: this.setDiceKey,
    };
  }

  constructor(keyIdOrDiceKey?: string | DiceKey | undefined) {
    if (typeof keyIdOrDiceKey === "string") {
      if (DiceKeyMemoryStore.hasKeyIdInMemory(keyIdOrDiceKey)) {
        this._keyId = keyIdOrDiceKey;
      }
    } else if (keyIdOrDiceKey != null) {
      this.setDiceKey(keyIdOrDiceKey);
    }
    makeAutoObservable(this);
  }
}
