import { action, makeObservable, override, runInAction } from "mobx";
import { DiceKey } from "../dicekeys/DiceKey";
import { HasSubViews } from "../state/core";
import { DiceKeyMemoryStore } from "../state/stores/DiceKeyMemoryStore";
import { DiceKeyState } from "../state/Window/DiceKeyState";

export enum SubViewsOfTopLevel {
  AppHomeView,
  AssemblyInstructions,
  LoadDicekey,
  DiceKeyView
};

type SubViews = SubViewsOfTopLevel;
const SubViews = SubViewsOfTopLevel;

export class WindowTopLevelNavigationState extends HasSubViews<SubViews> {

  navigateToWindowHomeView = action ( () => {
    this.foregroundDiceKeyState.clear();
    this.navigateTo(SubViews.AppHomeView);
  });
  navigateToAssemblyInstructions = this.navigateToSubView(SubViews.AssemblyInstructions)
  navigateToLoadDiceKey = this.navigateToSubView(SubViews.LoadDicekey)

  private navigateToSelectedDiceKeyViewForKeyId = action ( (keyId: string) => {
    this.foregroundDiceKeyState.setKeyId(keyId);
    this.navigateTo(SubViews.DiceKeyView);
  });

  navigateToSelectedDiceKeyView = async (diceKey: DiceKey) => {
    const keyId = await diceKey.keyId();
    runInAction( () => {
      DiceKeyMemoryStore.addDiceKeyForKeyId(keyId, diceKey);
      this.navigateToSelectedDiceKeyViewForKeyId(keyId);
    });
  }

  get subView(): SubViews {
    switch(this._subView) {
      case SubViews.DiceKeyView:
        return (this.foregroundDiceKeyState.diceKey != null) ? this._subView : SubViews.AppHomeView
      default:
        return this._subView
    }
  }

  constructor(public readonly foregroundDiceKeyState: DiceKeyState) {
    super(SubViews.AppHomeView);
    makeObservable(this, {
      subView: override,
    });
  }
}