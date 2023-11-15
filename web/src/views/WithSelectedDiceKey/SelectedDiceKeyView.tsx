import React from "react";
import { observer  } from "mobx-react";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { SecretDerivationView, SecretDerivationViewStateName } from "../Recipes/DerivationView";
import { DiceKeyMemoryStore, Navigation } from "../../state";
import { SeedHardwareKeyContentView } from "../Recipes/SeedHardwareKeyView";
import { BackupView } from "../BackupView/BackupView";
import { addPreview } from "../basics/Previews";
import { PrimaryView } from "../../css/Page";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import {
  SelectedDiceKeyBottomIconBarView,
} from "./SelectedDiceKeyBottomIconBarView";
import { SelectedDiceKeyContentRegionWithSideMargins} from "./SelectedDiceKeyLayout";
import { SelectedDiceKeyNavigationBar } from "./SelectedDiceKeyNavigationBar";
import { TopLevelNavigationBarFontSize } from "../../views/Navigation/NavigationLayout";
import { DisplayDiceKeyViewState, DisplayDiceKeyViewStateName } from "./SelectedDiceKeyViewState";
import { SeedHardwareKeyViewStateName } from "../../views/Recipes/SeedHardwareKeyViewState";
import { BackupViewStateName } from "../../views/BackupView/BackupViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import styled from "styled-components";
import {
  DeleteDiceKeyToDeviceStorageContentView,
  SaveDiceKeyToDeviceStorageContentView
} from "../../views/SaveAndDeleteDiceKeyView";
import {
  DeleteDiceKeyViewStateName,
  SaveDiceKeyViewStateName,
} from "../../views/SaveOrDeleteDiceKeyViewState";
import { DiceKeySelectorView } from "../../views/DiceKeySelectorView";
import { LoadDiceKeyFullPageView } from "../../views/LoadingDiceKeys/LoadDiceKeyView";


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
    selectedDiceKeyId={state.selectedDiceKeyVewState.diceKey.keyId}
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
  const {diceKey, subViewState} = state;
  if (diceKey == null) return null;
  switch(subViewState.viewName) {
    case SaveDiceKeyViewStateName: return (
      <SaveDiceKeyToDeviceStorageContentView state={subViewState} />
    );
    case DeleteDiceKeyViewStateName: return (
      <DeleteDiceKeyToDeviceStorageContentView state={subViewState} />
    );
    case DisplayDiceKeyViewStateName: return (
      <DisplayDiceKeyView state={subViewState} />
    );
    case SecretDerivationViewStateName: return (
      <SecretDerivationView state={subViewState} />
    );
    case SeedHardwareKeyViewStateName: return (
      <SeedHardwareKeyContentView seedHardwareKeyViewState={subViewState} />
    );
    case BackupViewStateName: return (
      <BackupView state={subViewState} nextStepAfterEnd={() => {
        subViewState.clear();
        state.navigateToDisplayDiceKey();
      }} />
    );
    default: return null;
  }
});

export const SelectedDiceKeyView = observer( ( props: SelectedDiceKeyViewProps) => {
  const {state} = props;
  const {diceKey, loadDiceKeyViewState} = state;
  if (loadDiceKeyViewState != null) {
    return (
      <LoadDiceKeyFullPageView
        onDiceKeyReadOrCancelled={state.onDiceKeyReadOrCancelled}
        state={loadDiceKeyViewState}
      />
    );
  }  if (!diceKey) return null;
  return (
    <PrimaryView>
      <SelectedDiceKeyNavigationBar {...props} />
      <SelectedDiceKeyContentRegionWithSideMargins>
        <SelectedDiceKeySubViewSwitch {...{...props}} />
      </SelectedDiceKeyContentRegionWithSideMargins>
      <SelectedDiceKeyBottomIconBarView {...props} />
    </PrimaryView>
    );
});



addPreview("SelectedDiceKey", () => (
  <SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, DiceKeyWithKeyId.testExample).navigateToDisplayDiceKey()}
/>));

addPreview("Recipes", () => (<SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, DiceKeyWithKeyId.testExample).navigateToDeriveSecrets()}
/>));

addPreview("SeedHardwareKey", () => (<SelectedDiceKeyView
  state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, DiceKeyWithKeyId.testExample).navigateToSeedHardwareKey()}
/>));