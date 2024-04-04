import { DiceKey } from "../../dicekeys/DiceKey";


export interface GetSetDiceKey {
  getDiceKey: () => DiceKey | undefined;
  setDiceKey: (diceKey: DiceKey | undefined) => void;
}
