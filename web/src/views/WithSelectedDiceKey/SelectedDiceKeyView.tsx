import React from "react";
import { observer  } from "mobx-react";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { SecretDerivationView, SecretDerivationViewStateName } from "../Recipes/DerivationView";
import { Navigation } from "../../state";
import { SeedHardwareKeyContentView } from "../Recipes/SeedHardwareKeyView";
import { BackupView } from "../BackupView/BackupView";
import { addPreview } from "../basics/Previews";
import { PageAsFlexColumn } from "../../css/Page";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import {
  SelectedDiceKeyBottomIconBarView,
} from "./SelectedDiceKeyBottomIconBarView";
import { SelectedDiceKeyContentRegionWithSideMargins} from "./SelectedDiceKeyLayout";
import { SelectedDiceKeyNavigationBar } from "./SelectedDiceKeyNavigationBar";
import { HeightBetweenTopNavigationBarAndStandardBottomBar, StandardSideMargin, StandardWidthBetweenSideMargins, TopLevelNavigationBarFontSize } from "../../views/Navigation/NavigationLayout";
import { cssCalcTyped, cssExprWithoutCalc } from "../../utilities";
import { DisplayDiceKeyViewState, DisplayDiceKeyViewStateName } from "./SelectedDiceKeyViewState";
import { SeedHardwareKeyViewStateName } from "../../views/Recipes/SeedHardwareKeyViewState";
import { BackupViewStateName } from "../../views/BackupView/BackupViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import {DivSupportingInvisible} from "../../css/DivSupportingInvisible"
import { ToggleState } from "../../state";
import styled from "styled-components";
import {
  DeleteDiceKeyViewStateName,
  SaveDiceKeyViewStateName,
  DeleteDiceKeyToDeviceStorageContentView,
  SaveDiceKeyToDeviceStorageContentView
} from "../../views/SaveAndDeleteDiceKeyView";

const IdealMinimumContentMargin = `2rem`

const DiceKeyMainViewColumns = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: row;
`;

export const SubViewButtonCaption = styled.div`
  font-size: calc(${TopLevelNavigationBarFontSize}*0.75);
  margin-top: min(0.75rem, 0.5vh);
`;

const RowHeight = cssExprWithoutCalc(`${HeightBetweenTopNavigationBarAndStandardBottomBar} - 2 * ${StandardSideMargin}`);
const Row = styled.div`
  height: calc(${RowHeight});
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
// IF WE PUT THINGS IN SIDE ROWS, WE'LL USE THIS
// const CenterRowWidth = cssExprWithoutCalc(`${StandardWidthBetweenSideMargins} / 2`);
const CenterRowWidth = cssExprWithoutCalc(`${StandardWidthBetweenSideMargins} / 1.25 `);

const SideRowWidth = cssExprWithoutCalc(`(${StandardWidthBetweenSideMargins} - ${CenterRowWidth})/2-${StandardSideMargin}`);
const CenterRow = styled(Row)`
  width: calc(${CenterRowWidth});
`;
const SideRow = styled(Row)`
  width: calc(${SideRowWidth});
`
const LeftSideRow = styled(SideRow)`
  margin-right: calc(${StandardSideMargin})
`
const RightSideRow = styled(SideRow)`
  margin-left: calc(${StandardSideMargin})
`

// Reserve 2rem for note about hiding DiceKey below
// Reserve content margin
const selectedDiceKeySize = cssCalcTyped(`min(${CenterRowWidth}, ${HeightBetweenTopNavigationBarAndStandardBottomBar} -10rem - 2 * ${IdealMinimumContentMargin})`);
const HideInstruction = styled(DivSupportingInvisible)`
  font-family: sans-serif;
  font-size: 1.25rem;
`

export const DislayDiceKeyView = observer( ({state}: {state: DisplayDiceKeyViewState}) => (
  <DiceKeyMainViewColumns>
    <LeftSideRow>
      {/* <SubViewButton
        onClick={ () => {} }
      >
        <SubViewButtonImage src={LoadDiceKeyImage} />
        <SubViewButtonCaption>Load Another DiceKey</SubViewButtonCaption>
      </SubViewButton> */}
    </LeftSideRow>
    <CenterRow>
      <DiceKeyView
        size={selectedDiceKeySize}
        faces={state.diceKey.faces}
        obscureAllButCenterDie={ToggleState.ObscureDiceKey}
      />
      <HideInstruction invisible={ToggleState.ObscureDiceKey.value}>Press on DiceKey to hide all but center face</HideInstruction>
    </CenterRow>
    <RightSideRow></RightSideRow>
  </DiceKeyMainViewColumns>
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
      <DislayDiceKeyView state={subViewState} />
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
  const diceKey = props.state.diceKey;
  if (!diceKey) return null;
  return (
    <PageAsFlexColumn>
      <SelectedDiceKeyNavigationBar {...props} />
      <SelectedDiceKeyContentRegionWithSideMargins>
        <SelectedDiceKeySubViewSwitch {...{...props}} />
      </SelectedDiceKeyContentRegionWithSideMargins>
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