import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import { PageAsFlexColumn } from "../css";
import { AppStoreInstallNudgeState } from "./AppStoreInstallNudgeState";
import { WindowRegionColumnContainer } from "./Navigation/NavigationLayout";

export const ContentRegion = styled(WindowRegionColumnContainer)`
  flex: 0 0 auto;
  margin-left: 5vw;
  margin-right: 5vw;
  width: 90vw;
`;

export const AppStoreInstallNudgeView = observer( ( {
  state,
}:
 {state: AppStoreInstallNudgeState }) => {
   const {appStoreName, osName} = state;
   
   return (
    <PageAsFlexColumn>
      <ContentRegion>
        { appStoreName }
        <ul>
          <li>Save DiceKeys&nbsp;{ 
            (appStoreName === "Apple") ? (<>in your device's local keychain</>) :
            (appStoreName === "GooglePlay") ? (<>in your device's protected storage</>) :
            (<>in your device</>)
          }</li>
          { osName === "Windows" || osName === "Android" || osName === "MacOS" ? (
            <li>Seed SoloKeys with a master secret from your DiceKey</li>
          ) : null}
        </ul>
      </ContentRegion>
    </PageAsFlexColumn>
  );
 });