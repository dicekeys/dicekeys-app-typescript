import { observer } from "mobx-react";
import React, { PropsWithChildren } from "react";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide, TopNavRightPopUpMenu, Clickable
} from "./Navigation/TopNavigationBar";
import { WindowTopLevelNavigationState } from "../state/Window";
import { BUILD_VERSION, BUILD_DATE } from "../vite-build-constants";
import { BooleanState } from "../state/reusable/BooleanState";

// &#8801; is hamburger menu?

const ExpandedMenu = observer ( ({children, booleanStateTrueIfMenuExpanded, ...props}: PropsWithChildren<{booleanStateTrueIfMenuExpanded: BooleanState} >) => (
  <TopNavRightPopUpMenu isOpen={booleanStateTrueIfMenuExpanded.value} {...props}>Yo!</TopNavRightPopUpMenu>
))
 
const WindowHomeMenu = observer ( (props: {booleanStateTrueIfMenuExpanded: BooleanState}) => (
  <ExpandedMenu {...props}>Yo!</ExpandedMenu>
) );

export const WindowHomeNavigationBar = observer( ( {
//  state,
//   goBack
}: {state: WindowTopLevelNavigationState}) => {
  const booleanStateTrueIfMenuExpanded = new BooleanState();
  return (
    <TopNavigationBar>
      <TopNavLeftSide style={{fontSize: `min(1.25vh, 1.25vw)`, alignSelf: `flex-end`}}>v{BUILD_VERSION}, {BUILD_DATE}</TopNavLeftSide>
      <TopNavCenter>DiceKeys App</TopNavCenter>
      <TopNavRightSide>
        <Clickable
          style={{fontSize: `6vh`, cursor: `grab`}}
          onClick={ booleanStateTrueIfMenuExpanded.toggle }
        >
          &#8801;
        </Clickable>
      </TopNavRightSide>
      <WindowHomeMenu {...{booleanStateTrueIfMenuExpanded}} />
    </TopNavigationBar>
  )
});