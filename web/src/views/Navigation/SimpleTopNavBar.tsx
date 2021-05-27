import {NavigationBars} from "../../css"
import { observer } from "mobx-react";
import React from "react";


export const SimpleTopNavBar = observer( ( props: {
  title?: string,
  goBack: () => any,
}) => (
  <div className={NavigationBars.TopNavigationBar}>
    <span className={NavigationBars.NavLeftSide} onClick={ props?.goBack } >&#8592;</span>
    <span className={NavigationBars.NavCenter}>{props.title ?? ""}</span>
    <span className={NavigationBars.NavRightSide}></span>
  </div>
));