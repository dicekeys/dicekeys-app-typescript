import React from "react";
import { observer  } from "mobx-react";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { SecretDerivationView, SecretDerivationViewStateName } from "../Recipes/DerivationView";
import { Navigation } from "../../state";
import { SeedHardwareKeyView } from "../Recipes/SeedHardwareKeyView";
import { BackupView } from "../BackupView/BackupView";
import { addPreview } from "../basics/Previews";
import { PageAsFlexColumn } from "../../css/Page";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import {
  SelectedDiceKeyBottomIconBarView,
} from "./SelectedDiceKeyBottomIconBarView";
import { SelectedDiceKeyContentRegionWithoutSideMargins} from "./SelectedDiceKeyLayout";
import { SelectedDiceKeyNavigationBar } from "./SelectedDiceKeyNavigationBar";
import { HeightBetweenTopNavigationBarAndStandardBottomBar } from "../../views/Navigation/NavigationLayout";
import { cssCalcTyped, cssExprWithoutCalc } from "../../utilities";
import { DisplayDiceKeyViewState, DisplayDiceKeyViewStateName } from "./SelectedDiceKeyViewState";
import { SeedHardwareKeyViewStateName } from "../../views/Recipes/SeedHardwareKeyViewState";
import { BackupViewStateName } from "../../views/BackupView/BackupViewState";
import { NavState } from "../../state/core/ViewState";

const IdealMinimumContentMargin = `2rem`

const selectedDiceKeySize = cssCalcTyped(`min(100vw - ${cssExprWithoutCalc(IdealMinimumContentMargin)}, ${cssExprWithoutCalc(HeightBetweenTopNavigationBarAndStandardBottomBar)} - 2 * ${cssExprWithoutCalc(IdealMinimumContentMargin)})`);

export const DislayDiceKeyView = ({state}: {state: DisplayDiceKeyViewState}) => (
  <DiceKeyView
  size={selectedDiceKeySize}
  faces={state.diceKey.faces}
/>
);

const SelectedDiceKeySubViewSwitch = observer( ( {state}: SelectedDiceKeyViewProps) => {
  const {diceKey, subViewState} = state;
  if (diceKey == null) return null;
  switch(subViewState.viewName) {
    case DisplayDiceKeyViewStateName: return (
      <DislayDiceKeyView state={subViewState} />
    );
    case SecretDerivationViewStateName: return (
      <SecretDerivationView state={subViewState} />
    );
    case SeedHardwareKeyViewStateName: return (
      <SeedHardwareKeyView parentNavState={state.navState} diceKey={diceKey} />
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
  const diceKey = props.state.diceKey;
  if (!diceKey) return null;
  return (
    <PageAsFlexColumn>
      {/* <ModalOverlayOfWindowBelowTopLevelNavigationBar>Modal testing</ModalOverlayOfWindowBelowTopLevelNavigationBar> */}
      <SelectedDiceKeyNavigationBar {...props} />
      <SelectedDiceKeyContentRegionWithoutSideMargins>
        <SelectedDiceKeySubViewSwitch {...{...props}} />
      </SelectedDiceKeyContentRegionWithoutSideMargins>
      <SelectedDiceKeyBottomIconBarView {...props} />
    </PageAsFlexColumn>
    );
});



addPreview("SelectedDiceKey", () => (
  <SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(NavState.root, DiceKeyWithKeyId.testExample).navigateToDisplayDiceKey()}
/>));

addPreview("Recipes", () => (<SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(NavState.root, DiceKeyWithKeyId.testExample).navigateToDeriveSecrets()}
/>));

addPreview("SeedHardwareKey", () => (<SelectedDiceKeyView
  state={new Navigation.SelectedDiceKeyViewState(NavState.root, DiceKeyWithKeyId.testExample).navigateToSeedHardwareKey()}
/>));