import {
  DiceKey
} from "../dicekeys/dicekey";

export class DiceKeyAppStateStore {
  // FIXME -- use browser storage
  diceKey?: DiceKey

  setDiceKey = (diceKey: DiceKey): DiceKey => {
    this.diceKey = diceKey;
    return diceKey;
  }
}

export const diceKeyAppStateStore = new DiceKeyAppStateStore();