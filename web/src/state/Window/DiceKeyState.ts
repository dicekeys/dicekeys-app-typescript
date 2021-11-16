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
    const {keyId} = this;
    return keyId ? DiceKeyMemoryStore.diceKeyForKeyId(keyId) : undefined;
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

  setKeyId = action( (keyId?: string) => {
    const oldKeyId = this.keyId;
    if (keyId != oldKeyId && oldKeyId != null) {
      // Pull the DiceKey we're no longer using out of the memory store.
      DiceKeyMemoryStore.removeDiceKey(oldKeyId);
    }
    this.keyId = keyId
  });

  setKeyIdAndDiceKey = action ( (keyId: string, diceKey:DiceKey) => {
    DiceKeyMemoryStore.addDiceKeyForKeyId(keyId, diceKey.rotateToTurnCenterFaceUpright());
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
