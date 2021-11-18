import { observer } from "mobx-react";
import React from "react";
// import { RUNNING_IN_ELECTRON, ValuesDefinedOnlyWhenRunningElectron } from "../utilities/is-electron";
// import { addressBarState } from "../state/core/AddressBarState";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide
} from "./Navigation/TopNavigationBar";
import { WindowTopLevelNavigationState } from "../state/Window";
import { BUILD_VERSION, BUILD_DATE } from "../vite-build-constants";

// &#8801; is hamburger menu?

export const WindowHomeNavigationBar = observer( ( {
//  state,
//   goBack
}: {state: WindowTopLevelNavigationState}) => {
  return (
    <TopNavigationBar>
      <TopNavLeftSide style={{fontSize: `min(1.25vh, 1.25vw)`, alignSelf: `flex-end`}}>v{BUILD_VERSION}, {BUILD_DATE}</TopNavLeftSide>
      <TopNavCenter>DiceKeys App</TopNavCenter>
      <TopNavRightSide
      style={{fontSize: `6vh`}}
        onClick={ () => {} }
      >
        &#8801;
      </TopNavRightSide>
    </TopNavigationBar>
  )
});