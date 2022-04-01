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
import { SaveDiceKeyStateName, SaveDiceKeyToDeviceStorageView, DeleteDiceKeyStateName, DeleteDiceKeyFromDeviceStroageView } from "./SaveDiceKeyView";
import { RUNNING_IN_ELECTRON } from "../utilities/is-electron";

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
    case SaveDiceKeyStateName:
      return (<SaveDiceKeyToDeviceStorageView state={subViewState} closeFn={ addressBarState.back } />);
    case DeleteDiceKeyStateName:
      return (<DeleteDiceKeyFromDeviceStroageView state={subViewState} closeFn={ addressBarState.back } />);
    case LoadDiceKeyViewStateName:
      return (
        <LoadDiceKeyView
          onDiceKeyReadOrCancelled={ windowTopLevelNavigationState.onReturnFromActionThatMayLoadDiceKey }
          state={ subViewState }
        />
      );
    case AssemblyInstructionsStateName:
      return (
        <AssemblyInstructionsView onComplete={ windowTopLevelNavigationState.onReturnFromActionThatMayLoadDiceKey } state={subViewState}
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

const defaultWindowNavigationState = ( (): WindowTopLevelNavigationState => {
  if (RUNNING_IN_ELECTRON) {
    const state = new WindowTopLevelNavigationState();
//    addressBarState.setInitialState("", () => {});
    return state;
  } else {
    return WindowTopLevelNavigationState.fromPath()
  }
})();
export const WindowTopLevelView = observer ( ({
  windowTopLevelNavigationState = defaultWindowNavigationState } : {
  windowTopLevelNavigationState?: WindowTopLevelNavigationState
}) => (
  <PrimaryView>
    <WindowRoutingView {...{windowTopLevelNavigationState}} />
  </PrimaryView>
));
