import { action, computed, makeAutoObservable } from "mobx";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../stores/DiceKeyMemoryStore";

export interface WithOptionalDiceKey {
  diceKey?: DiceKeyWithKeyId;
}

export interface WithDiceKey {
  diceKey: DiceKeyWithKeyId;
}

export interface SettableDiceKey {
  diceKey: DiceKeyWithKeyId;
  setDiceKey: (diceKey: DiceKeyWithKeyId) => void;
}

export interface SettableOptionalDiceKey {
  diceKey?: DiceKeyWithKeyId;
  setDiceKey: (diceKey?: DiceKeyWithKeyId) => void;
}

export class SettableOptionalDiceKeyIndirect implements SettableOptionalDiceKey {
  constructor(
    private readonly withObservableOptionalDiceKey: WithOptionalDiceKey,
    public readonly setDiceKey: (diceKey?: DiceKeyWithKeyId) => void,
  ) {}

  get diceKey() { return this.withObservableOptionalDiceKey.diceKey }
}

export class SettableDiceKeyIndirect implements SettableDiceKey {
  constructor(
    private readonly withObservableDiceKey: WithDiceKey,
    public readonly setDiceKey: (diceKey: DiceKeyWithKeyId) => void,
  ) {}

  get diceKey() { return this.withObservableDiceKey.diceKey }
}

export class SettableOptionalDiceKeyState implements SettableOptionalDiceKey {
  private _diceKey?: DiceKeyWithKeyId;

  get diceKey(): DiceKeyWithKeyId | undefined { return this._diceKey }
  setDiceKey = action ( (diceKey?: DiceKeyWithKeyId) => {this._diceKey = diceKey} );

  constructor (diceKey ?: DiceKeyWithKeyId) {
    this._diceKey = diceKey;
    makeAutoObservable(this);
  }
}

export class DiceKeyState implements SettableOptionalDiceKey {
  keyId?: string = undefined;
  public get diceKey(): DiceKeyWithKeyId | undefined {
    const {keyId} = this;
    return keyId ? DiceKeyMemoryStore.diceKeyForKeyId(keyId) : undefined;
  };

  constructor(
    diceKey?: DiceKeyWithKeyId,
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
    if (oldKeyId === keyId) {
      // This is a no-op as the value hasn't changed.
      return;
    }
    if (oldKeyId != null) {
      // Pull the DiceKey we're no longer using out of the memory store.
      // DiceKeyMemoryStore.removeDiceKey(oldKeyId);
      // FIXME -- we'll make this explicit later.
    }
    this.keyId = keyId
  });

  private setKeyIdAndDiceKey = action ( (diceKey: DiceKeyWithKeyId) => {
    this.keyId = diceKey.keyId;
    const diceKeyWithCenterFaceUpright = DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey);
    return diceKeyWithCenterFaceUpright;
  });

  clear = action ( () => this.keyId = undefined );

  public setDiceKey = async (diceKey?: DiceKeyWithKeyId) => {
    if (diceKey == null) {
      this.setKeyId(undefined);
    } else {
      this.setKeyIdAndDiceKey(await diceKey.withKeyId);
    }
  }
}
