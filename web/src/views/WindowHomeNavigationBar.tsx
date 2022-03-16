import { observer } from "mobx-react";
import React from "react";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide
} from "./Navigation/NavigationLayout";
import { WindowTopLevelNavigationState } from "../state/Window";
import { BooleanState } from "../state/reusable/BooleanState";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { DiceKeysNavHamburgerMenu, ExpandableMenuProps, HamburgerMenuButton, MenuItem } from "./Navigation/Menu";
import { RUNNING_IN_BROWSER } from "../utilities/is-electron";
import { DiceKeyMemoryStore } from "../state";


const WindowHomeMenu = observer ( ({state, ...props}: {state: WindowTopLevelNavigationState} & ExpandableMenuProps) => (
  <DiceKeysNavHamburgerMenu {...props}>
    { RUNNING_IN_BROWSER ? null : (
      <MenuItem onClick={async () => {
        state.navigateToSeedFidoKey();
      }}>Seed a FIDO Hardware Security Key</MenuItem>
    )}
    <MenuItem onClick={async () => {
      const diceKey = await DiceKeyWithKeyId.fromRandom();
      DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey);
      state.navigateToSelectedDiceKeyView(diceKey);
    }}>Load random DiceKey</MenuItem>
  </DiceKeysNavHamburgerMenu>
) );

export const WindowHomeNavigationBar = observer( ( {
  state,
//   goBack
}: {state: WindowTopLevelNavigationState}) => {
  const booleanStateTrueIfMenuExpanded = new BooleanState();
  return (
    <TopNavigationBar>
      <TopNavLeftSide style={{fontSize: `min(1.25vh, 1.25vw)`, alignSelf: `flex-end`}}></TopNavLeftSide>
      <TopNavCenter>DiceKeys</TopNavCenter>
      <TopNavRightSide>
        <HamburgerMenuButton {...{booleanStateTrueIfMenuExpanded}} />
      </TopNavRightSide>
      <WindowHomeMenu {...{state, booleanStateTrueIfMenuExpanded}} />
    </TopNavigationBar>
  )
});