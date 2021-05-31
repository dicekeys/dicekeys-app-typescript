import {NavigationBars} from "../../css"
import { observer } from "mobx-react";
import React from "react";

const isRunningInElectron: boolean = !!(window && window.process && "type" in window.process && window.process["type"]);

export const SimpleTopNavBar = observer( ( props: {
  title?: string,
  goBack?: () => any,
}) => {
  // The default goBack action is to call window.history.back()
  const {goBack = window.history.back } = props;
  // Make the top left nav bar a button iff we're running in electron,
  // otherwise we're in the browser and this should be a no-op (undefined onClick handler)
  // as the web-based app relies on the back button within the browser.
  const onClick = isRunningInElectron ? goBack : undefined;
  return (
    <div className={NavigationBars.TopNavigationBar}>
      <span className={NavigationBars.NavLeftSide} onClick={ onClick } >{
        isRunningInElectron ?
          // Show a back button in Electron
          (<>&#8592;</>) :
          // Don't show a back button for the web app, as the browser back button will work.
          (<></>)
        }</span>
      <span className={NavigationBars.NavCenter}>{props.title ?? ""}</span>
      <span className={NavigationBars.NavRightSide}></span>
    </div>
  )
});