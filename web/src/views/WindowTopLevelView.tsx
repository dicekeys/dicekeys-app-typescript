import { observer } from "mobx-react";
import React from "react";
import { DiceKey } from "../dicekeys/DiceKey";
import {WindowTopLevelNavigationState as WindowTopLevelNavigationState, SubViewsOfTopLevel, SelectedDiceKeyViewState} from "../state/Window";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { WindowHomeView } from "./WindowHomeView";
import { LoadDiceKeyView, LoadDiceKeyViewState } from "./LoadingDiceKeys/LoadDiceKeyView";
import {AssemblyInstructionsView} from "./AssemblyInstructionsView"
import { AssemblyInstructionsState } from "./AssemblyInstructionsState";
import { addressBarState } from "../state/core/AddressBarState";
import {ApproveApiRequestView} from "./api-request-handling/ApproveApiRequestView";
import { ApiRequestsReceivedState } from "../state/ApiRequestsReceivedState";
import { PrimaryView } from "../css";
import { SeedHardwareKeyPrimaryView } from "./Recipes/SeedHardwareKeyView";
import { DiceKeyMemoryStore } from "../state";

export const WindowRoutingView = observer ( ({windowTopLevelNavigationState}: {windowTopLevelNavigationState: WindowTopLevelNavigationState}) => {

  const onReturnFromAssemblyInstructions = async () => {
    const diceKey = windowTopLevelNavigationState.foregroundDiceKeyState.diceKey;
    if (diceKey) {
      await DiceKeyMemoryStore.addDiceKeyAsync(diceKey);
      windowTopLevelNavigationState.navigateToSelectedDiceKeyView(diceKey);
    } else {
      windowTopLevelNavigationState.navigateToWindowHomeView()
    }
  }
  const onDiceKeyLoaded = async (diceKey?: DiceKey) => {
    if (diceKey != null) {
      await DiceKeyMemoryStore.addDiceKeyAsync(diceKey);
      windowTopLevelNavigationState.navigateToSelectedDiceKeyView(await diceKey.withKeyId);
    }
  }

  const {foregroundApiRequest} = ApiRequestsReceivedState;
  if (foregroundApiRequest != null) {
    return (
      <ApproveApiRequestView queuedApiRequest={foregroundApiRequest}
        settableDiceKeyState={windowTopLevelNavigationState.foregroundDiceKeyState}
        onApiRequestResolved={ApiRequestsReceivedState.dequeueApiRequestReceived}
      />
    )
  }
  // console.log(`Displaying subview ${windowTopLevelNavigationState.subView}`)
  const {subViewState} = windowTopLevelNavigationState;
  switch (subViewState?.viewName) {
    case "LoadDiceKey":
      return (
        <LoadDiceKeyView
          onDiceKeyRead={ onDiceKeyLoaded }
          onCancelled={ addressBarState.back }
          state={ subViewState }
          // state={new LoadDiceKeyState("camera")}
        />
      );
    case "AssemblyInstructions":
      return (
        <AssemblyInstructionsView onComplete={ onReturnFromAssemblyInstructions } state={subViewState}
//          new AssemblyInstructionsState(windowTopLevelNavigationState.foregroundDiceKeyState)
         />
    )
    case SubViewsOfTopLevel.SeedFidoKey: return (
      <SeedHardwareKeyPrimaryView windowTopLevelNavigationState={windowTopLevelNavigationState} />
    );
    case SubViewsOfTopLevel.DiceKeyView: return (
      <SelectedDiceKeyView state={new SelectedDiceKeyViewState( windowTopLevelNavigationState.foregroundDiceKeyState)} />
    );
    default: return (
      <WindowHomeView windowNavigationState={windowTopLevelNavigationState} />
    );
  }
});

export const WindowTopLevelView = observer ( (props: Partial<WindowTopLevelNavigationProps>) => {
  const {
    windowTopLevelNavigationState = new WindowTopLevelNavigationState(),
  } = props;
  return (
  <PrimaryView>
    <WindowRoutingView {...{windowTopLevelNavigationState}} />
  </PrimaryView>
)});
