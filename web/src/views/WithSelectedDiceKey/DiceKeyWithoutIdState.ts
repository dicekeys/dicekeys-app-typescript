import { DiceKey, DiceKeyInHumanReadableForm, DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";
import { makeAutoObservable } from "mobx";
import { GetSetDiceKey } from "./GetSetDiceKey";


export class DiceKeyWithoutIdState implements GetSetDiceKey {

  private _humanReadableForm: DiceKeyInHumanReadableForm | undefined;

  readonly getDiceKey = () => this._humanReadableForm == null ? undefined : DiceKeyWithoutKeyId.fromHumanReadableForm(this._humanReadableForm);

  readonly setDiceKey = async (diceKey: DiceKey | undefined) => {
    this._humanReadableForm = diceKey?.inHumanReadableForm;
  };

  get getSetDiceKey(): GetSetDiceKey {
    return {
      getDiceKey: this.getDiceKey,
      setDiceKey: this.setDiceKey,
    };
  }

  constructor(diceKey?: DiceKey) {
    this._humanReadableForm = diceKey?.inHumanReadableForm;
    makeAutoObservable(this);
  }
}
