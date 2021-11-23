import { observer } from "mobx-react";
import React, { PropsWithChildren } from "react";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide, TopNavRightPopUpMenu, Clickable
} from "./Navigation/TopNavigationBar";
import { WindowTopLevelNavigationState } from "../state/Window";
import { BUILD_VERSION, BUILD_DATE } from "../vite-build-constants";
import { BooleanState } from "../state/reusable/BooleanState";
import styled from "styled-components";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";

// &#8801; is hamburger menu?

const ExpandedMenu = observer ( ({children, booleanStateTrueIfMenuExpanded, ...props}: PropsWithChildren<{booleanStateTrueIfMenuExpanded: BooleanState} >) => (
  <TopNavRightPopUpMenu isOpen={booleanStateTrueIfMenuExpanded.value} {...props}>{children}</TopNavRightPopUpMenu>
))

const MenuItem = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: baseline;
  border-top-color: ${ props => props.theme.colors.navigationBarForeground };
  border-top-style: dotted;
  border-top-width: 1px;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 1rem;
  padding-right: 1rem;
  font-size: 1rem;
  user-select: none;
  :hover {
    color: ${ props => (props.onClick != null) ? props.theme.colors.background : props.theme.colors.navigationBarForeground }
  }
`;

const MenuItemDisplayOnlyContent = styled.div`
  font-style: italic;
  text-align: left;
  font-size: 0.8rem;
`

const WindowHomeMenu = observer ( ({state, ...props}: {state: WindowTopLevelNavigationState, booleanStateTrueIfMenuExpanded: BooleanState}) => (
  <ExpandedMenu {...props}>
    <MenuItem onClick={async () => {
      state.navigateToSelectedDiceKeyView(await DiceKeyWithKeyId.fromRandom());
    }}>Load random DiceKey</MenuItem>
    {/* <MenuItem>Yo!</MenuItem> */}
    <MenuItem><MenuItemDisplayOnlyContent>Version {BUILD_VERSION}<br/>{BUILD_DATE}</MenuItemDisplayOnlyContent></MenuItem>
  </ExpandedMenu>
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