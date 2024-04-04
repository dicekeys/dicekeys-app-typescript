// import { action, makeAutoObservable } from "mobx";
// import { DiceKey } from "../../dicekeys/DiceKey";

// export interface WithOptionalDiceKey {
//   diceKey?: DiceKey;
// }

// export interface WithDiceKey {
//   diceKey: DiceKey;
// }

// export interface SettableDiceKey {
//   diceKey: DiceKey;
//   setDiceKey: (diceKey: DiceKey) => void;
// }

// export interface SettableOptionalDiceKey {
//   diceKey?: DiceKey;
//   setDiceKey: (diceKey?: DiceKey) => void;
// }

// export class SettableOptionalDiceKeyIndirect implements SettableOptionalDiceKey {
//   constructor(
//     private readonly withObservableOptionalDiceKey: WithOptionalDiceKey,
//     public readonly setDiceKey: (diceKey?: DiceKey) => void,
//   ) {}

//   get diceKey() { return this.withObservableOptionalDiceKey.diceKey }
// }

// export class SettableDiceKeyIndirect implements SettableDiceKey {
//   constructor(
//     private readonly withObservableDiceKey: WithDiceKey,
//     public readonly setDiceKey: (diceKey: DiceKey) => void,
//   ) {}

//   get diceKey() { return this.withObservableDiceKey.diceKey }
// }

// export class SettableOptionalDiceKeyState implements SettableOptionalDiceKey {
//   private _diceKey?: DiceKey;

//   get diceKey(): DiceKey | undefined { return this._diceKey }
//   setDiceKey = action ( (diceKey?: DiceKey) => {this._diceKey = diceKey} );

//   constructor (diceKey ?: DiceKey) {
//     this._diceKey = diceKey;
//     makeAutoObservable(this);
//   }
// }

// export class DiceKeyState implements SettableOptionalDiceKey {
//   keyId?: string = undefined;
//   public get diceKey(): DiceKey | undefined {
//     const {keyId} = this;
//     return keyId ? DiceKeyMemoryStore.diceKeyForKeyId(keyId) : undefined;
//   }

//   constructor(
//     diceKey?: DiceKey,
//   ) {
//     makeAutoObservable(this, {
//       diceKey: computed
//     });
//     if (diceKey != null) {
//       this.setDiceKey(diceKey);
//     }
//   }

//   setKeyId = action( (keyId?: string) => {
//     const oldKeyId = this.keyId;
//     if (oldKeyId === keyId) {
//       // This is a no-op as the value hasn't changed.
//       return;
//     }
//     if (oldKeyId != null) {
//     }
//     this.keyId = keyId
//   });

//   private setKeyIdAndDiceKey = action ( (diceKey: DiceKey) => {
//     this.keyId = diceKey.keyId;
//     const diceKeyWithCenterFaceUpright = DiceKeyMemoryStore.addDiceKey(diceKey);
//     return diceKeyWithCenterFaceUpright;
//   });

//   clear = ( () => this.keyId = undefined );

//   public setDiceKey = async (diceKey?: DiceKey) => {
//     if (diceKey == null) {
//       this.setKeyId(undefined);
//     } else {
//       this.setKeyIdAndDiceKey(diceKey.withKeyId);
//     }
//   }
// }
