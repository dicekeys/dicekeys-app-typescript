import { action, makeObservable, override, runInAction } from "mobx";
import { AssemblyInstructionsState } from "./AssemblyInstructionsState";
import { DiceKey } from "../../dicekeys/DiceKey";
import { HasSubViews } from "../core";
import { DiceKeyMemoryStore } from "../stores/DiceKeyMemoryStore";
import { DiceKeyState } from "./DiceKeyState";
import { SelectedDiceKeyViewState } from "./SelectedDiceKeyViewState";

export enum SubViewsOfTopLevel {
  AppHomeView,
  AssemblyInstructions,
  LoadDicekey,
  DiceKeyView
};

type SubViews = SubViewsOfTopLevel;
const SubViews = SubViewsOfTopLevel;

export class WindowState extends HasSubViews<SubViews> {

  navigateToTopLevelView = this.navigateToSubView(SubViews.AppHomeView);
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
        return (this.selectedDiceKeyViewState && this.foregroundDiceKeyState.diceKey != null) ? this._subView : SubViews.AppHomeView
      default:
        return this._subView
    }
  }

  foregroundDiceKeyState: DiceKeyState = new DiceKeyState();
  get foregroundDiceKey() { return this.foregroundDiceKeyState.diceKey }
  selectedDiceKeyViewState: SelectedDiceKeyViewState = new SelectedDiceKeyViewState( this.navigateToTopLevelView, this.foregroundDiceKeyState );



  private onReturnFromAssemblyInstructions = () => {
    const diceKey = this.foregroundDiceKeyState.diceKey;
    if (diceKey) {
      this.navigateToSelectedDiceKeyView(diceKey);
    } else {
      this.navigateToTopLevelView()
    }
  }
  assemblyInstructionsState = new AssemblyInstructionsState(this.foregroundDiceKeyState, this.onReturnFromAssemblyInstructions);

  constructor() {
    super(SubViews.AppHomeView);
    makeObservable(this, {
      subView: override,
    });
  }
}