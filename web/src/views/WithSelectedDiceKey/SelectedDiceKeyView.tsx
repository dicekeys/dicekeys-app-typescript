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
import { HeightBetweenTopNavigationBarAndStandardBottomBar, TopLevelNavigationBarFontSize, WindowRegionBelowTopNavigationBarAndAboveStandardBottomBar } from "../../views/Navigation/NavigationLayout";
import { cssCalcTyped, cssExprWithoutCalc } from "../../utilities";
import { DisplayDiceKeyViewState, DisplayDiceKeyViewStateName } from "./SelectedDiceKeyViewState";
import { SeedHardwareKeyViewStateName } from "../../views/Recipes/SeedHardwareKeyViewState";
import { BackupViewStateName } from "../../views/BackupView/BackupViewState";
import { NavigationPathState } from "../../state/core/ViewState";
//import { SubViewButton } from "../../css/SubViewButton";

//import LoadDiceKeyImage from "../../images/Scanning a DiceKey.svg";
import styled from "styled-components";
const IdealMinimumContentMargin = `2rem`


const DiceKeyMainViewColumns = styled(WindowRegionBelowTopNavigationBarAndAboveStandardBottomBar)`
  flex: 0 0 auto;
  flex-direction: row;
`;

// const SubViewButtonImage = styled.img`
//   width: 14vw;
// `;

export const SubViewButtonCaption = styled.div`
  font-size: calc(${TopLevelNavigationBarFontSize}*0.75);
  margin-top: min(0.75rem, 0.5vh);
`;

const SideRow = styled.div`
  height: calc(${HeightBetweenTopNavigationBarAndStandardBottomBar});
  width: 20vw;
  margin-left: 2.5vw;
  margin-right: 2.5vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const selectedDiceKeySize = cssCalcTyped(`min(50vw - ${cssExprWithoutCalc(IdealMinimumContentMargin)}, ${cssExprWithoutCalc(HeightBetweenTopNavigationBarAndStandardBottomBar)} - 2 * ${cssExprWithoutCalc(IdealMinimumContentMargin)})`);

export const DislayDiceKeyView = ({state}: {state: DisplayDiceKeyViewState}) => (
  <DiceKeyMainViewColumns>
    <SideRow>
      {/* <SubViewButton
        onClick={ () => {} }
      >
        <SubViewButtonImage src={LoadDiceKeyImage} />
        <SubViewButtonCaption>Load Another DiceKey</SubViewButtonCaption>
      </SubViewButton> */}
    </SideRow>
    <DiceKeyView
      size={selectedDiceKeySize}
      faces={state.diceKey.faces}
    />
    <SideRow></SideRow>
  </DiceKeyMainViewColumns>
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
    state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, DiceKeyWithKeyId.testExample).navigateToDisplayDiceKey()}
/>));

addPreview("Recipes", () => (<SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, DiceKeyWithKeyId.testExample).navigateToDeriveSecrets()}
/>));

addPreview("SeedHardwareKey", () => (<SelectedDiceKeyView
  state={new Navigation.SelectedDiceKeyViewState(NavigationPathState.root, DiceKeyWithKeyId.testExample).navigateToSeedHardwareKey()}
/>));