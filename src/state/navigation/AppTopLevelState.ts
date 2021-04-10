import { action, makeObservable, override, runInAction } from "mobx";
import { DiceKey } from "../../dicekeys/dicekey";
import { HasSubViews } from "../core";
import { DiceKeyStore } from "../stores/dicekey-store";
import { SelectedDiceKeyViewState } from "./SelectedDiceKeyViewState";

export enum SubViewsOfTopLevel {
  AppHomeView,
  AssemblyInstructions,
  LoadDicekey,
  DiceKeyView
};

type SubViews = SubViewsOfTopLevel;
const SubViews = SubViewsOfTopLevel;

export class AppTopLevelState extends HasSubViews<SubViews> {

  selectedDiceKeyViewState?: SelectedDiceKeyViewState = undefined;

  get subView(): SubViews {
    switch(this._subView) {
      case SubViews.DiceKeyView:
        return (this.selectedDiceKeyViewState && this.selectedDiceKeyViewState.diceKey) ? this._subView : SubViews.AppHomeView
      default:
        return this._subView
    }
  }

  navigateToTopLevelView = this.navigateToSubView(SubViews.AppHomeView);
  navigateToAssemblyInstructions = this.navigateToSubView(SubViews.AssemblyInstructions)
  navigateToLoadDiceKey = this.navigateToSubView(SubViews.LoadDicekey)

  private navigateToSelectedDiceKeyViewForKeyId = action ( (keyId: string) => {
    this.selectedDiceKeyViewState = new SelectedDiceKeyViewState( this.navigateToTopLevelView, keyId );
    this.navigateTo(SubViews.DiceKeyView);
  });

  navigateToSelectedDiceKeyView = async (diceKey: DiceKey) => {
    const keyId = await DiceKey.keyId(diceKey);
    runInAction( () => {
      DiceKeyStore.addDiceKeyForKeyId(keyId, diceKey);
      this.navigateToSelectedDiceKeyViewForKeyId(keyId);
    });
  }

  constructor() {
    super(SubViews.AppHomeView);
    makeObservable(this, {
      subView: override,
    });
  }
}