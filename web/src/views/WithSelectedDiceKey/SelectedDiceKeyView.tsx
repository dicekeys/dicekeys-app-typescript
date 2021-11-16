import React from "react";
import { observer  } from "mobx-react";
import { DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { DerivationView } from "../Recipes/DerivationView";
import { Navigation } from "../../state";
import { SeedHardwareKeyView } from "../Recipes/SeedHardwareKeyView";
import { BackupView } from "../BackupView/BackupView";
import { DiceKeyState } from "../../state/Window/DiceKeyState";
import { addPreview } from "../basics/Previews";
import { PageAsFlexColumn } from "../../css/Page";
import { SelectedDiceKeyViewProps } from "./SelectedDiceKeyViewProps";
import {
  SelectedDiceKeyBottomIconBarView,
} from "./SelectedDiceKeyBottomIconBarView";
import { SelectedDiceKeyContentRegionWithoutSideMargins, HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh } from "./SelectedDiceKeyLayout";
import { SelectedDiceKeyNavigationBar } from "./SelectedDiceKeyNavigationBar";
const SubViews = Navigation.SelectedDiceKeySubViews

const IdealMinimumContentMargin = `2rem`

const SelectedDiceKeySubViewSwitch = observer( ( {state}: SelectedDiceKeyViewProps) => {
  const {foregroundDiceKeyState } = state;
  const diceKey = foregroundDiceKeyState.diceKey;
  if (!diceKey) return null;
  switch(state.subView) {
    case Navigation.SelectedDiceKeySubViews.DisplayDiceKey: return (
      <DiceKeyView
        size={`calc(min(100vw - (${IdealMinimumContentMargin}), ${HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh}vh - 2 * (${IdealMinimumContentMargin})))`}
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
  if (!diceKey) return null;
  return (
    <PageAsFlexColumn>
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
    state={new Navigation.SelectedDiceKeyViewState(new DiceKeyState(DiceKeyWithoutKeyId.testExample), SubViews.DisplayDiceKey)}
/>));

addPreview("Recipes", () => (<SelectedDiceKeyView
      state={new Navigation.SelectedDiceKeyViewState(new DiceKeyState(DiceKeyWithoutKeyId.testExample), SubViews.DeriveSecrets)}
  />)
);

addPreview("SeedHardwareKey", () => (<SelectedDiceKeyView
  state={new Navigation.SelectedDiceKeyViewState(new DiceKeyState(DiceKeyWithoutKeyId.testExample), SubViews.SeedHardwareKey)}
/>)
);