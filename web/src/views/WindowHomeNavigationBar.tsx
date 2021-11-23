import { observer } from "mobx-react";
import React from "react";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide, Clickable
} from "./Navigation/TopNavigationBar";
import { WindowTopLevelNavigationState } from "../state/Window";
import { BooleanState } from "../state/reusable/BooleanState";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { DiceKeysNavHamburgerMenu, MenuItem } from "./Navigation/Menu";


const WindowHomeMenu = observer ( ({state, ...props}: {state: WindowTopLevelNavigationState, booleanStateTrueIfMenuExpanded: BooleanState}) => (
  <DiceKeysNavHamburgerMenu {...props}>
    <MenuItem onClick={async () => {
      state.navigateToSelectedDiceKeyView(await DiceKeyWithKeyId.fromRandom());
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
      <TopNavCenter>DiceKeys App</TopNavCenter>
      <TopNavRightSide>
        <Clickable
          style={{fontSize: `6vh`, cursor: `grab`}}
          onClick={ booleanStateTrueIfMenuExpanded.toggle }
        >
          &#8801;
        </Clickable>
      </TopNavRightSide>
      <WindowHomeMenu {...{state, booleanStateTrueIfMenuExpanded}} />
    </TopNavigationBar>
  )
});