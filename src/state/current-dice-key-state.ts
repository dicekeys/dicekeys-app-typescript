// import {
//   DiceKey
// } from "../dicekeys/dicekey";
// import { makeAutoObservable } from "mobx";
// import { autoSave } from "./core/auto-save";
// import { DiceKeyStore } from "./stores/dicekey-store";

// export class CurrentDiceKeyState {
//   constructor(
//     public goBack: () => any,
//     public keyId: string
//   ) {
//     makeAutoObservable(this);
//     autoSave(this, "CurrentDiceKeyState");
//   }

// //  keyId: string | undefined;
//   public get diceKey(): DiceKey | undefined {
//     return this.keyId ? DiceKeyStore.diceKeysByKeyId[this.keyId] : undefined;
//   };

//   public get seed(): string | undefined { 
//     const diceKey = this.diceKey;
//     return (diceKey == null) ? undefined : DiceKey.toSeedString(diceKey, true)
//   }

//   // setKeyId = action( (keyId?: string) => {
//   //   this.keyId = keyId;
//   // });

//   // setDiceKey = async (diceKey?: DiceKey) => {
//   //   if (typeof diceKey === "undefined") {
//   //     this.setKeyId();
//   //   } else {
//   //     const keyId = await DiceKey.keyId(diceKey);
//   //     DiceKeyStore.addDiceKeyForKeyId(keyId, diceKey);
//   //   }
//   // }

//   static create = async (goBack: () => any, diceKey: DiceKey): Promise<CurrentDiceKeyState> => {
//     const keyId = await DiceKey.keyId(diceKey);
//     DiceKeyStore.addDiceKeyForKeyId(keyId, diceKey);
//     return new CurrentDiceKeyState(goBack, keyId);
//   }
// }