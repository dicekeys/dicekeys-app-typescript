import { observer } from "mobx-react";
import React from "react";
import { DiceKey } from "../dicekeys/DiceKey";
import {WindowTopLevelNavigationState as WindowTopLevelNavigationState, SubViewsOfTopLevel, SelectedDiceKeyViewState} from "../state/Window";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { WindowHomeView } from "./WindowHomeView";
import { LoadDiceKeyView, LoadDiceKeyState } from "./LoadingDiceKeys/LoadDiceKeyView";
import {Layout} from "../css";
import {AssemblyInstructionsView} from "./AssemblyInstructionsView"
import { DiceKeyState } from "../state/Window/DiceKeyState";
import { AssemblyInstructionsState } from "./AssemblyInstructionsState";


interface WindowTopLevelNavigationProps {
  windowNavigationState: WindowTopLevelNavigationState;
}
export const WindowRoutingView = observer ( ({windowNavigationState}: WindowTopLevelNavigationProps) => {

  const onReturnFromAssemblyInstructions = () => {
    const diceKey = windowNavigationState.foregroundDiceKeyState.diceKey;
    if (diceKey) {
      windowNavigationState.navigateToSelectedDiceKeyView(diceKey);
    } else {
      windowNavigationState.navigateToWindowHomeView()
    }
  }
  const onDiceKeyLoaded = (diceKey?: DiceKey) => {
    if (diceKey != null) {
      windowNavigationState.navigateToSelectedDiceKeyView(diceKey);
    }
  }

  switch (windowNavigationState.subView) {
    case SubViewsOfTopLevel.AppHomeView: return (
      <WindowHomeView {...{windowNavigationState}}/>
    );
    case SubViewsOfTopLevel.LoadDicekey: return (
      <LoadDiceKeyView
        onDiceKeyRead={ onDiceKeyLoaded }
        onCancelled={ windowNavigationState.navigateToWindowHomeView }
        state={new LoadDiceKeyState("camera")} />
    )
    case SubViewsOfTopLevel.AssemblyInstructions: return (
      <AssemblyInstructionsView onComplete={ onReturnFromAssemblyInstructions } state={
        new AssemblyInstructionsState(windowNavigationState.foregroundDiceKeyState)
      } />
    )
    case SubViewsOfTopLevel.DiceKeyView: return (
      <SelectedDiceKeyView state={new SelectedDiceKeyViewState( windowNavigationState.navigateToWindowHomeView, windowNavigationState.foregroundDiceKeyState)} />
    );
  }
});

export const WindowTopLevelView = observer ( (props: Partial<WindowTopLevelNavigationProps>) => {
  const {
    windowNavigationState = new WindowTopLevelNavigationState(new DiceKeyState()),
  } = props;
  return (
  <div className={Layout.PrimaryView} >
    <WindowRoutingView {...{windowNavigationState}} />
  </div>
)});
