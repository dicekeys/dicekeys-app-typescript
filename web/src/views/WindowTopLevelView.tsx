import { observer } from "mobx-react";
import React from "react";
import {WindowTopLevelNavigationState as WindowTopLevelNavigationState} from "../state/Window";
import { SelectedDiceKeyViewStateName } from "./WithSelectedDiceKey/SelectedDiceKeyViewState";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { WindowHomeView } from "./WindowHomeView";
import { LoadDiceKeyView, LoadDiceKeyViewStateName } from "./LoadingDiceKeys/LoadDiceKeyView";
import {AssemblyInstructionsView} from "./AssemblyInstructionsView"
import { AssemblyInstructionsStateName } from "./AssemblyInstructionsState";
import { addressBarState } from "../state/core/AddressBarState";
import {ApproveApiRequestState, ApproveApiRequestView} from "./api-request-handling/ApproveApiRequestView";
import { ApiRequestsReceivedState } from "../state/ApiRequestsReceivedState";
import { PrimaryView } from "../css";
import { SeedHardwareKeySimpleView } from "./Recipes/SeedHardwareKeyView";
import { SeedHardwareKeyViewStateName } from "./Recipes/SeedHardwareKeyViewState";


export const WindowRoutingView = observer ( ({windowTopLevelNavigationState}: {windowTopLevelNavigationState: WindowTopLevelNavigationState}) => {

  const {foregroundApiRequest} = ApiRequestsReceivedState;
  if (foregroundApiRequest != null) {
    return (
      <ApproveApiRequestView state={new ApproveApiRequestState(foregroundApiRequest)}
//        settableDiceKeyState={windowTopLevelNavigationState.foregroundDiceKeyState}
        onApiRequestResolved={ApiRequestsReceivedState.dequeueApiRequestReceived}
      />
    )
  }
  // console.log(`Displaying subview ${windowTopLevelNavigationState.subView}`)
  const {subViewState} = windowTopLevelNavigationState.subView;
  switch (subViewState?.viewName) {
    case LoadDiceKeyViewStateName:
      return (
        <LoadDiceKeyView
          onDiceKeyRead={ windowTopLevelNavigationState.loadScannedOrEnteredDiceKey }
          onCancelled={ addressBarState.back }
          state={ subViewState }
        />
      );
    case AssemblyInstructionsStateName:
      return (
        <AssemblyInstructionsView onComplete={ windowTopLevelNavigationState.onReturnFromAssemblyInstructions } state={subViewState}
//          new AssemblyInstructionsState(windowTopLevelNavigationState.foregroundDiceKeyState)
         />
    )
    case SeedHardwareKeyViewStateName: return (
      <SeedHardwareKeySimpleView seedHardwareKeyViewState={subViewState} />
    );
    case SelectedDiceKeyViewStateName: return (
      <SelectedDiceKeyView state={subViewState} goBack={ addressBarState.back } />
    );
    default: return (
      <WindowHomeView windowNavigationState={windowTopLevelNavigationState} />
    );
  }
});

export const WindowTopLevelView = observer ( ({
  windowTopLevelNavigationState = WindowTopLevelNavigationState.fromPath() } : {
  windowTopLevelNavigationState?: WindowTopLevelNavigationState
}) => (
  <PrimaryView>
    <WindowRoutingView {...{windowTopLevelNavigationState}} />
  </PrimaryView>
));
