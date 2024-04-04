import React from "react";
import { observer } from "mobx-react";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { SecretDerivationView, SecretDerivationViewState } from "../Recipes/DerivationView";
import { DiceKeyMemoryStore, Navigation } from "../../state";
import { SeedHardwareKeyContentView } from "../Recipes/SeedHardwareKeyView";
import { BackupDiceKeyView } from "../BackupView/BackupDiceKeyView";
import { addPreview } from "../basics/Previews";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import {
  SelectedDiceKeyBottomIconBarView,
} from "./SelectedDiceKeyBottomIconBarView";
import { SelectedDiceKeyContentRegionWithSideMargins } from "./SelectedDiceKeyLayout";
import { SelectedDiceKeyNavigationBar } from "./SelectedDiceKeyNavigationBar";
import { TopLevelNavigationBarFontSize } from "../../views/Navigation/NavigationLayout";
import { DisplayDiceKeyViewState } from "./SelectedDiceKeyViewState";
import { DiceKeyInMemoryStoreState } from "./DiceKeyInMemoryStoreState";
import { SeedHardwareKeyViewState } from "../../views/Recipes/SeedHardwareKeyViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import styled from "styled-components";
import {
  DeleteDiceKeyToDeviceStorageContentView,
  SaveDiceKeyToDeviceStorageContentView
} from "../../views/SaveAndDeleteDiceKeyView";
import {
  DeleteDiceKeyViewStateName,
  SaveDiceKeyViewStateName,
  SaveOrDeleteDiceKeyViewState,
} from "../../views/SaveOrDeleteDiceKeyViewState";
import { DiceKeySelectorView } from "../../views/DiceKeySelectorView";
import { LoadDiceKeyFullPageView } from "../../views/LoadingDiceKeys/LoadDiceKeyView";
import { BackupDiceKeyState } from "../BackupView/BackupDiceKeyState";


// const DiceKeyMainViewColumns = styled.div`
//   display: flex;
//   flex: 0 0 auto;
//   flex-direction: row;
// `;

export const SubViewButtonCaption = styled.div`
  font-size: calc(${TopLevelNavigationBarFontSize}*0.75);
  margin-top: min(0.75rem, 0.5vh);
`;

// Reserve 2rem for note about hiding DiceKey below
// Reserve content margin

export const DisplayDiceKeyView = observer( ({state}: {state: DisplayDiceKeyViewState}) => (
  <DiceKeySelectorView
    loadRequested={state.selectedDiceKeyVewState.startLoadDiceKey}
    selectedDiceKeyId={state.selectedDiceKeyVewState.selectedDiceKeyState.keyId}
    setSelectedDiceKeyId={ async (keyId) => {
      if (keyId == null) return;
      const diceKey = await DiceKeyMemoryStore.load({keyId});
      if (diceKey == null) return;
      state.selectedDiceKeyVewState.setDiceKey(diceKey);
    }}
    $rowWidth={`90vw`}
    $selectedItemWidth={`min(70vh,50vw)`}
    $ratioOfSelectedItemWidthToSelectableItemWidth={`4`}
  />
));

const SelectedDiceKeySubViewSwitch = observer( ( {state}: SelectedDiceKeyViewProps) => {
  const {subViewState} = state;
  if (subViewState instanceof SaveOrDeleteDiceKeyViewState && subViewState.viewName === SaveDiceKeyViewStateName) {
    return (<SaveDiceKeyToDeviceStorageContentView state={subViewState} />);
  } else if (subViewState instanceof SaveOrDeleteDiceKeyViewState && subViewState.viewName === DeleteDiceKeyViewStateName) {
    return (<DeleteDiceKeyToDeviceStorageContentView state={subViewState} />);
  } else if (subViewState instanceof DisplayDiceKeyViewState) {
    return (<DisplayDiceKeyView state={subViewState} />);
  } else if (subViewState instanceof SecretDerivationViewState) {
    return (<SecretDerivationView state={subViewState} /> );
  } else if (subViewState instanceof  SeedHardwareKeyViewState) {
    return (<SeedHardwareKeyContentView seedHardwareKeyViewState={subViewState} />);
  } else if (subViewState instanceof BackupDiceKeyState) {
    return (
      <BackupDiceKeyView state={subViewState} onComplete={() => {
        state.backupViewState.subView.clear();
        state.navigateToDisplayDiceKey();
      }} />
    );
  }
  return null;
});

export const SelectedDiceKeyView = observer( ( props: SelectedDiceKeyViewProps) => {
  const {state} = props;
  const {loadDiceKeyViewState} = state;
  if (loadDiceKeyViewState != null) {
    return (
      <LoadDiceKeyFullPageView
        onDiceKeyReadOrCancelled={state.onDiceKeyReadOrCancelled}
        state={loadDiceKeyViewState}
      />
    );
  }
  return (
    <>
      <SelectedDiceKeyNavigationBar {...props} />
      <SelectedDiceKeyContentRegionWithSideMargins>
        <SelectedDiceKeySubViewSwitch {...{...props}} />
      </SelectedDiceKeyContentRegionWithSideMargins>
      <SelectedDiceKeyBottomIconBarView {...props} />
    </>
    );
});



addPreview("SelectedDiceKey", () => (
  <SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, new DiceKeyInMemoryStoreState(DiceKeyWithKeyId.testExample)).navigateToDisplayDiceKey()}
/>));

addPreview("Recipes", () => (<SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, new DiceKeyInMemoryStoreState(DiceKeyWithKeyId.testExample)).navigateToDeriveSecrets()}
/>));

addPreview("SeedHardwareKey", () => (<SelectedDiceKeyView
  state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, new DiceKeyInMemoryStoreState(DiceKeyWithKeyId.testExample)).navigateToSeedHardwareKey()}
/>));