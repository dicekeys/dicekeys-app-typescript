import { observer } from "mobx-react";
import React from "react";
import { WindowTopLevelNavigationState } from "../state/Window";
import { SelectedDiceKeyViewStateName } from "./WithSelectedDiceKey/SelectedDiceKeyViewState";
import { SelectedDiceKeyView } from "./WithSelectedDiceKey/SelectedDiceKeyView";
import { WindowHomeView } from "./WindowHomeView";
import { LoadDiceKeyViewStateName } from "./LoadingDiceKeys/LoadDiceKeyViewState";
import { LoadDiceKeyFullPageView } from "./LoadingDiceKeys/LoadDiceKeyView";
import { AssemblyInstructionsView } from "./AssemblyInstructionsView";
import { AssemblyInstructionsStateName } from "./AssemblyInstructionsState";
import { ApproveApiRequestView } from "./api-request-handling/ApproveApiRequestView";
import { ApproveApiRequestState } from "./api-request-handling/ApproveApiRequestState";
import { ApiRequestsReceivedState } from "../state/ApiRequestsReceivedState";
import { PrimaryView } from "../css";
import { SeedHardwareKeyFullPageView } from "./Recipes/SeedHardwareKeyView";
import { SeedHardwareKeyViewStateName } from "./Recipes/SeedHardwareKeyViewState";
import { SaveDiceKeyToDeviceStorageView, DeleteDiceKeyToDeviceStorageView } from "./SaveAndDeleteDiceKeyView";
import {
  SaveDiceKeyViewStateName,
  DeleteDiceKeyViewStateName,
} from "./SaveOrDeleteDiceKeyViewState";
import { SecretSharingRecoveryStateName } from "./SimpleSecretSharing/SecretSharingRecoveryState";
import { SecretSharingRecoveryView } from "./SimpleSecretSharing/SecretSharingRecoveryView";

export const WindowRoutingView = observer ( ({state}: {state: WindowTopLevelNavigationState}) => {

  const {foregroundApiRequest} = ApiRequestsReceivedState;
  if (foregroundApiRequest != null) {
    return (
      <ApproveApiRequestView state={new ApproveApiRequestState(foregroundApiRequest)}/>
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
          onDiceKeyReadOrCancelled={ (result) => state.onReturnFromActionThatMayLoadDiceKey(result?.diceKey) }
          state={ subViewState }
        />
      );
    case AssemblyInstructionsStateName:
      return (
        <AssemblyInstructionsView onComplete={ (diceKey) => state.onReturnFromActionThatMayLoadDiceKey(diceKey) } state={subViewState}
//          new AssemblyInstructionsState(state.foregroundDiceKeyState)
         />
    )
    case SeedHardwareKeyViewStateName: return (
      <SeedHardwareKeyFullPageView seedHardwareKeyViewState={subViewState} />
    );
    case SelectedDiceKeyViewStateName: return (
      <SelectedDiceKeyView state={subViewState} />
    );
    case SecretSharingRecoveryStateName: return (
      <SecretSharingRecoveryView 
        state={subViewState}
        onComplete={ async (diceKey) => {
          if (diceKey != null) {
           state.navigateToReplaceSelectedDiceKeyView(await diceKey.withKeyId);
        }}}
      />);
    default: return (
      <WindowHomeView state={state} />
    );
  }
});



export const WindowTopLevelView = observer ( ({state} : {
  state: WindowTopLevelNavigationState
}) => (
  <PrimaryView>
    <WindowRoutingView state={state} />
  </PrimaryView>
));
