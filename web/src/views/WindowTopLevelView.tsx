import { observer } from "mobx-react";
import React from "react";
import { DiceKey } from "../dicekeys/DiceKey";
import {WindowTopLevelNavigationState as WindowTopLevelNavigationState, SubViewsOfTopLevel, SelectedDiceKeyViewState} from "../state/Window";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { WindowHomeView } from "./WindowHomeView";
import { LoadDiceKeyView, LoadDiceKeyState } from "./LoadingDiceKeys/LoadDiceKeyView";
import {AssemblyInstructionsView} from "./AssemblyInstructionsView"
import { AssemblyInstructionsState } from "./AssemblyInstructionsState";
import { addressBarState } from "../state/core/AddressBarState";
import {ApproveApiRequestView} from "./api-request-handling/ApproveApiRequestView";
import { ApiRequestsReceivedState } from "../state/ApiRequestsReceivedState";
import { PrimaryView } from "../css";

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

  const {foregroundApiRequest} = ApiRequestsReceivedState;
  if (foregroundApiRequest != null) {
    return (
      <ApproveApiRequestView queuedApiRequest={foregroundApiRequest}
        settableDiceKeyState={windowNavigationState.foregroundDiceKeyState}
        onApiRequestResolved={ApiRequestsReceivedState.dequeueApiRequestReceived}
      />
    )
  }

  switch (windowNavigationState.subView) {
    case SubViewsOfTopLevel.AppHomeView: return (
      <WindowHomeView {...{windowNavigationState}}/>
    );
    case SubViewsOfTopLevel.LoadDiceKeyView: return (
      <LoadDiceKeyView
        onDiceKeyRead={ onDiceKeyLoaded }
        onCancelled={ () => addressBarState.back }
        state={new LoadDiceKeyState("camera")} />
    )
    case SubViewsOfTopLevel.AssemblyInstructions: return (
      <AssemblyInstructionsView onComplete={ onReturnFromAssemblyInstructions } state={
        new AssemblyInstructionsState(windowNavigationState.foregroundDiceKeyState)
      } />
    )
    case SubViewsOfTopLevel.DiceKeyView: return (
      <SelectedDiceKeyView state={new SelectedDiceKeyViewState( windowNavigationState.foregroundDiceKeyState)} />
    );
  }
});

export const WindowTopLevelView = observer ( (props: Partial<WindowTopLevelNavigationProps>) => {
  const {
    windowNavigationState = new WindowTopLevelNavigationState(),
  } = props;
  return (
  <PrimaryView>
    <WindowRoutingView {...{windowNavigationState}} />
  </PrimaryView>
)});
