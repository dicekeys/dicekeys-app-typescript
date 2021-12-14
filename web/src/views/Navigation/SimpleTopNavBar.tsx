import { observer } from "mobx-react";
import React from "react";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { addressBarState } from "../../state/core/AddressBarState";
import {
  TopNavigationBar,
  TopNavLeftSide, TopNavCenter, TopNavRightSide
} from "./NavigationLayout";

export const SimpleTopNavBar = observer( ( props: {
  title?: string,
  goBack?: () => any,
}) => {
  const {goBack = addressBarState.back } = props;
  // Make the top left nav bar a button iff we're running in electron,
  // otherwise we're in the browser and this should be a no-op (undefined onClick handler)
  // as the web-based app relies on the back button within the browser.
  const onClick = RUNNING_IN_ELECTRON ? goBack : undefined;
  return (
    <TopNavigationBar>
      <TopNavLeftSide onClick={ onClick } >{
        RUNNING_IN_ELECTRON ?
          // Show a back button in Electron
          (<>&#8592;</>) :
          // Don't show a back button for the web app, as the browser back button will work.
          (<></>)
        }</TopNavLeftSide>
      <TopNavCenter>{props.title ?? ""}</TopNavCenter>
      <TopNavRightSide></TopNavRightSide>
    </TopNavigationBar>
  )
});