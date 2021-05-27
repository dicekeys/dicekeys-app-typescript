import { observer } from "mobx-react";
import React from "react";
import { DiceKey } from "../dicekeys/DiceKey";
import {WindowState, SubViewsOfTopLevel} from "../state/Window";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { AppHomeView } from "./AppHomeView";
import { LoadDiceKeyView, LoadDiceKeyState } from "./LoadingDiceKeys/LoadDiceKeyView";
import {Layout} from "../css";
import {AssemblyInstructionsView} from "./AssemblyInstructionsView"

const DefaultAppTopLevelState = new WindowState();

interface AppTopLevelRoutingViewProps {
  appTopLevelState?: WindowState;
}
export const AppTopLevelRoutingView = observer ( (props: AppTopLevelRoutingViewProps) => {
  const {appTopLevelState = DefaultAppTopLevelState} = props;
  const onDiceKeyLoaded = (diceKey?: DiceKey) => {
    if (diceKey != null) {
      appTopLevelState.navigateToSelectedDiceKeyView(diceKey);
    }
  }

  switch (appTopLevelState.subView) {
    case SubViewsOfTopLevel.AppHomeView: return (
      <AppHomeView {...{appTopLevelState}}/>
    );
    case SubViewsOfTopLevel.LoadDicekey: return (
      <LoadDiceKeyView onDiceKeyRead={ onDiceKeyLoaded } state={new LoadDiceKeyState("camera")} />
    )
    case SubViewsOfTopLevel.AssemblyInstructions: return (
      <AssemblyInstructionsView onComplete={ onDiceKeyLoaded } state={appTopLevelState.assemblyInstructionsState} />
    )
    case SubViewsOfTopLevel.DiceKeyView: return (
      <SelectedDiceKeyView state={appTopLevelState.selectedDiceKeyViewState} />
    );
  }
});

export const AppTopLevelView = observer ( (props: AppTopLevelRoutingViewProps) => (
  <div className={Layout.PrimaryView} >
    <AppTopLevelRoutingView {...props} />
  </div>
));
