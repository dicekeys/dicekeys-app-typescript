import React from "react";
import { observer  } from "mobx-react";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";
import { DerivationView } from "../Recipes/DerivationView";
import { Navigation } from "../../state";
import { SeedHardwareKeyView } from "../Recipes/SeedHardwareKeyView";
import { SimpleTopNavBar } from "../Navigation/SimpleTopNavBar";
import { BackupView } from "../BackupView/BackupView";
import { DiceKeyState } from "../../state/Window/DiceKeyState";
import { addPreview } from "../basics/Previews";
import { PageAsFlexColumn } from "../../css/Page";
import {
  SelectedDiceKeyBottomIconBarView,
  SelectedDiceKeyViewProps,
} from "./SelectedDiceKeyBottomIconBarView";
import { BetweenTopNavigationBarAndBottomIconBar, HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh } from "./SelectedDiceKeyLayout";
const SubViews = Navigation.SelectedDiceKeySubViews

const IdealMinimumContentMargin = `2rem`

const SelectedDiceKeySubViewSwitch = observer( ( {state}: SelectedDiceKeyViewProps) => {
  const {foregroundDiceKeyState } = state;
  const diceKey = foregroundDiceKeyState.diceKey;
  if (!diceKey) return null;
  switch(state.subView) {
    case Navigation.SelectedDiceKeySubViews.DisplayDiceKey: return (
      <DiceKeyViewAutoSized
        maxWidth={`100vw - (${IdealMinimumContentMargin})`}
        maxHeight={`${HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh}vh - 2 * (${IdealMinimumContentMargin})`}
        faces={diceKey.faces}
      />
    );
    case Navigation.SelectedDiceKeySubViews.DeriveSecrets: return (
      <DerivationView diceKey={diceKey} />
    );
    case Navigation.SelectedDiceKeySubViews.SeedHardwareKey: return (
      <SeedHardwareKeyView diceKey={diceKey} />
    );
    case Navigation.SelectedDiceKeySubViews.Backup: return (
      <BackupView state={state.backupState} nextStepAfterEnd={() => {
        state.backupState.clear();
        state.navigateToDisplayDiceKey();
      }} />
    );
    default: return null;
  }
});

export const SelectedDiceKeyView = observer( ( props: SelectedDiceKeyViewProps) => {
  const diceKey = props.state.foregroundDiceKeyState.diceKey;
  const {goBack} = props;
  if (!diceKey) return null;
  return (
    <PageAsFlexColumn>
      <SimpleTopNavBar title={diceKey.nickname} goBack={goBack} />
      <BetweenTopNavigationBarAndBottomIconBar>
        <SelectedDiceKeySubViewSwitch {...{...props}} />
      </BetweenTopNavigationBarAndBottomIconBar>
      <SelectedDiceKeyBottomIconBarView {...props} />
    </PageAsFlexColumn>
    );
});



addPreview("SelectedDiceKey", () => (
  <SelectedDiceKeyView
    goBack={() => alert("Back off man, I'm a scientist!")}
    state={new Navigation.SelectedDiceKeyViewState(new DiceKeyState(DiceKey.testExample), SubViews.DisplayDiceKey)}
/>));

addPreview("Recipes", () => (<SelectedDiceKeyView
      state={new Navigation.SelectedDiceKeyViewState(new DiceKeyState(DiceKey.testExample), SubViews.DeriveSecrets)}
  />)
);

addPreview("SeedHardwareKey", () => (<SelectedDiceKeyView
  state={new Navigation.SelectedDiceKeyViewState(new DiceKeyState(DiceKey.testExample), SubViews.SeedHardwareKey)}
/>)
);