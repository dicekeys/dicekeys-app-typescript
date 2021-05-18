import { observer } from "mobx-react";
import React from "react";
import { DiceKey } from "../dicekeys/DiceKey";
import {AppTopLevelState, SubViewsOfTopLevel} from "../state/navigation";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { AppHomeView } from "./AppHomeView";
import { LoadDiceKeyView, LoadDiceKeyState } from "./LoadingDiceKeys/LoadDiceKeyView";
import {Layout} from "../css";
import {AssemblyInstructionsView, AssemblyInstructionsState} from "./AssemblyInstructionsView"

const DefaultAppTopLevelState = new AppTopLevelState();

interface AppTopLevelRoutingViewProps {
  appTopLevelState?: AppTopLevelState;
}
export const AppTopLevelRoutingView = observer ( (props: AppTopLevelRoutingViewProps) => {
  const appTopLevelState = props.appTopLevelState ?? DefaultAppTopLevelState;
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
      <AssemblyInstructionsView onComplete={ onDiceKeyLoaded } state={new AssemblyInstructionsState()} />
    )
    case SubViewsOfTopLevel.DiceKeyView: return (
      <SelectedDiceKeyView navigationState={appTopLevelState.selectedDiceKeyViewState!} />
    );
  }
});

export const AppTopLevelView = observer ( (props: AppTopLevelRoutingViewProps) => (
  <div className={Layout.PrimaryView} >
    <AppTopLevelRoutingView {...props} />
  </div>
));
