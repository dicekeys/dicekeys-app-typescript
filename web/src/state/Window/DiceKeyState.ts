import { action, computed, makeAutoObservable } from "mobx";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../stores/DiceKeyMemoryStore";

export interface SettableDiceKeyState {
  diceKey?: DiceKey;
  setDiceKey: (diceKey?: DiceKey) => any;
}

export class DiceKeyState implements SettableDiceKeyState {
  keyId?: string = undefined;
  public get diceKey(): DiceKey | undefined {
    return this.keyId ? DiceKeyMemoryStore.diceKeyForKeyId(this.keyId) : undefined;
  };

  constructor(
    diceKey?: DiceKey,
  ) {
    makeAutoObservable(this, {
      diceKey: computed
    });
    if (diceKey != null) {
      this.setDiceKey(diceKey);
    }
  }

  setKeyId = action( (keyId?: string) => this.keyId = keyId );

  setKeyIdAndDiceKey = action ( (keyId: string, diceKey:DiceKey) => {
    DiceKeyMemoryStore.addDiceKeyForKeyId(keyId, diceKey);
    this.keyId = keyId;
  });

  clear = action ( () => this.keyId = undefined );

  public setDiceKey = async (diceKey?: DiceKey) => {
    if (diceKey == null) {
      this.setKeyId(undefined);
    } else {
      this.setKeyIdAndDiceKey(await diceKey.keyId(), diceKey);
    }
  }
}
