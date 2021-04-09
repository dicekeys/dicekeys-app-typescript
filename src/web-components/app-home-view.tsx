import { Face } from "@dicekeys/read-dicekey-js";
import { observer } from "mobx-react";
import React from "react";
import { DiceKey, TupleOf25Items } from "../dicekeys/dicekey";
import {AppTopLevelState, SubViewsOfTopLevel} from "../state/navigation";
import { ScanDiceKeyView } from "./reading-dicekeys/scan-dicekey-view";
import { SelectedDiceKeyView } from "./selected-dicekey/selected-dicekey-view";
import ReactDOM from "react-dom";

const DefaultAppHomeViewState = new AppTopLevelState();

interface AppHomeViewProps {
  appTopLevelState: AppTopLevelState;
}
export const AppHomeView = observer ( (props: AppHomeViewProps) => {
  const {appTopLevelState} = props;
  return (
    <div>
      <div onClick={ appTopLevelState.navigateToLoadDiceKey }>Load dice key</div>
      <div onClick={ appTopLevelState.navigateToAssemblyInstructions }>Assembly instructions</div>
    </div>
  )
});

interface AppTopLevelRoutingViewProps {
  appTopLevelState?: AppTopLevelState;
}
export const AppTopLevelRoutingView = observer ( (props: AppTopLevelRoutingViewProps) => {
  const appTopLevelState = props.appTopLevelState ?? DefaultAppHomeViewState;
  switch (appTopLevelState.subView) {
    case SubViewsOfTopLevel.AppHomeView: return (
      <AppHomeView {...{appTopLevelState}}/>
    );
    case SubViewsOfTopLevel.LoadDicekey: return (
      <ScanDiceKeyView onDiceKeyRead={ (facesRead) => {
        const diceKey = DiceKey( facesRead.map( f => f.toFace() ) as TupleOf25Items<Face> );
        appTopLevelState.navigateToSelectedDiceKeyView(diceKey);
      } } />
    )
    case SubViewsOfTopLevel.AssemblyInstructions: return (
      null
    )
    case SubViewsOfTopLevel.DiceKeyView: return (
      <SelectedDiceKeyView onBack={ () => appTopLevelState.navigateToTopLevelView() } navigationState={appTopLevelState.selectedDiceKeyViewState!} />
    );
  }
});

(window as {testComponent?: {}}).testComponent = {
  ...((window as {testComponent?: {}}).testComponent ?? {}),
  AppTopLevelRoutingView: () => {
    ReactDOM.render(<AppTopLevelRoutingView />, document.getElementById("app-container"))
}};
