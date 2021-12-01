import { action, computed, makeAutoObservable } from "mobx";
import { DiceKey, DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../stores/DiceKeyMemoryStore";

export interface SettableDiceKeyState {
  diceKey?: DiceKey;
  setDiceKey: (diceKey?: DiceKey) => any;
}

export class DiceKeyState implements SettableDiceKeyState {
  keyId?: string = undefined;
  public get diceKey(): DiceKeyWithKeyId | undefined {
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

  private setKeyIdAndDiceKeyForDiceKeyWithCenterFaceUpright = action ( (diceKey: DiceKeyWithKeyId) => {
    DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey);
    this.keyId = diceKey.keyId;
  });

  private setKeyIdAndDiceKey = async (diceKey: DiceKeyWithKeyId) => {
    const diceKeyWithCenterFaceUpright = await diceKey.rotateToTurnCenterFaceUpright();
    this.setKeyIdAndDiceKeyForDiceKeyWithCenterFaceUpright(diceKeyWithCenterFaceUpright);
  };

  clear = action ( () => this.keyId = undefined );

  public setDiceKey = async (diceKey?: DiceKey) => {
    if (diceKey == null) {
      this.setKeyId(undefined);
    } else {
      this.setKeyIdAndDiceKey(await diceKey.withKeyId);
    }
  }
}
