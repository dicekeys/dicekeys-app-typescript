import { Face, FaceRead } from "@dicekeys/read-dicekey-js";
import { observer } from "mobx-react";
import React from "react";
import { DiceKey, TupleOf25Items } from "../dicekeys/dicekey";
import {AppTopLevelState, SubViewsOfTopLevel} from "../state/navigation";
import { ScanDiceKeyView } from "./reading-dicekeys/ScanDiceKeyView";
import { SelectedDiceKeyView } from "./selected-dicekey/selected-dicekey-view";
import { AppHomeView } from "./AppHomeView";

const DefaultAppTopLevelState = new AppTopLevelState();

interface AppTopLevelRoutingViewProps {
  appTopLevelState?: AppTopLevelState;
}
export const AppTopLevelRoutingView = observer ( (props: AppTopLevelRoutingViewProps) => {
  const appTopLevelState = props.appTopLevelState ?? DefaultAppTopLevelState;
  const onDiceKeyRead = (facesRead: TupleOf25Items<FaceRead>) => {
    const diceKey = DiceKey( facesRead.map( f => f.toFace() ) as TupleOf25Items<Face> );
    appTopLevelState.navigateToSelectedDiceKeyView(diceKey);
  }

  switch (appTopLevelState.subView) {
    case SubViewsOfTopLevel.AppHomeView: return (
      <AppHomeView {...{appTopLevelState}}/>
    );
    case SubViewsOfTopLevel.LoadDicekey: return (
      <ScanDiceKeyView onDiceKeyRead={ onDiceKeyRead } />
    )
    case SubViewsOfTopLevel.AssemblyInstructions: return (
      null
    )
    case SubViewsOfTopLevel.DiceKeyView: return (
      <SelectedDiceKeyView onBack={ () => appTopLevelState.navigateToTopLevelView() } navigationState={appTopLevelState.selectedDiceKeyViewState!} />
    );
  }
});
