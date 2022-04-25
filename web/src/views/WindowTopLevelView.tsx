import { observer } from "mobx-react";
import React from "react";
import {WindowTopLevelNavigationState } from "../state/Window";
import { SelectedDiceKeyViewStateName } from "./WithSelectedDiceKey/SelectedDiceKeyViewState";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { WindowHomeView } from "./WindowHomeView";
import { LoadDiceKeyFullPageView, LoadDiceKeyViewStateName } from "./LoadingDiceKeys/LoadDiceKeyView";
import {AssemblyInstructionsView} from "./AssemblyInstructionsView"
import { AssemblyInstructionsStateName } from "./AssemblyInstructionsState";
import {ApproveApiRequestState, ApproveApiRequestView} from "./api-request-handling/ApproveApiRequestView";
import { ApiRequestsReceivedState } from "../state/ApiRequestsReceivedState";
import { PrimaryView } from "../css";
import { SeedHardwareKeyFullPageView } from "./Recipes/SeedHardwareKeyView";
import { SeedHardwareKeyViewStateName } from "./Recipes/SeedHardwareKeyViewState";
import { SaveDiceKeyViewStateName, SaveDiceKeyToDeviceStorageView, DeleteDiceKeyViewStateName, DeleteDiceKeyToDeviceStorageView } from "./SaveAndDeleteDiceKeyView";

export const WindowRoutingView = observer ( ({state}: {state: WindowTopLevelNavigationState}) => {

  const {foregroundApiRequest} = ApiRequestsReceivedState;
  if (foregroundApiRequest != null) {
    return (
      <ApproveApiRequestView state={new ApproveApiRequestState(foregroundApiRequest)}
        onApiRequestResolved={ApiRequestsReceivedState.dequeueApiRequestReceived}
      />
    )
  }
  // console.log(`Displaying subview ${state.subView}`)
  const {subViewState} = state.subView;
  console.log(`Re-rendering top level switch for view name ${subViewState?.viewName}`);
  switch (subViewState?.viewName) {
    case SaveDiceKeyViewStateName:
      return (<SaveDiceKeyToDeviceStorageView state={subViewState} />);
    case DeleteDiceKeyViewStateName:
      return (<DeleteDiceKeyToDeviceStorageView state={subViewState} />);
    case LoadDiceKeyViewStateName:
      return (
        <LoadDiceKeyFullPageView
          onDiceKeyReadOrCancelled={ state.onReturnFromActionThatMayLoadDiceKey }
          state={ subViewState }
        />
      );
    case AssemblyInstructionsStateName:
      return (
        <AssemblyInstructionsView onComplete={ state.onReturnFromActionThatMayLoadDiceKey } state={subViewState}
//          new AssemblyInstructionsState(state.foregroundDiceKeyState)
         />
    )
    case SeedHardwareKeyViewStateName: return (
      <SeedHardwareKeyFullPageView seedHardwareKeyViewState={subViewState} />
    );
    case SelectedDiceKeyViewStateName: return (
      <SelectedDiceKeyView state={subViewState} />
    );
    default: return (
      <WindowHomeView state={state} />
    );
  }
});



export const WindowTopLevelView = observer ( ({
  state = WindowTopLevelNavigationState.main } : {
  state?: WindowTopLevelNavigationState
}) => (
  <PrimaryView>
    <WindowRoutingView state={state} />
  </PrimaryView>
));
