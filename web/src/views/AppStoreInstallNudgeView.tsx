import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import { AppStoreInstallNudgeState } from "./AppStoreInstallNudgeState";
import { AppStoreName, OperatingSystemName } from "../utilities/OperatingSystemAndAppStoreName";
import { ButtonRow, PushButton } from "../css/Button";
import { cssCalcTyped } from "../utilities/cssCalc";

const horizontalMargin = `10vw`;
const horizontalPaddingFormula = `min(3vw, 3vh)`;
const calcNotificationBarWidth = cssCalcTyped(
  `100vw - 2 * (${horizontalMargin} + ${horizontalPaddingFormula})`
);

export const PageTopNotificationBarContainer = styled.div`
  /* Fix at top of window, centered, with view width of 80vw */
  position: fixed;
  top: 0;
  left: ${horizontalMargin};
  width: ${calcNotificationBarWidth};

  /* Move in front of main content */
  z-index: 1;

  /* User colors thate emulate common browser chrome */
  border-color: #a0a0a0;
  background-color: #f9ed95;
  color: black;

  /* Border around everything but top */
  border-style: solid;
  border-width: calc(min(1vw, 1vh)/3);
  border-bottom-left-radius: calc(min(1vw, 1vh));
  border-bottom-right-radius: calc(min(1vw, 1vh));

  /* No margin or border at top so that content region touches the top of the page
     touching the chrome (address bar region)
  */
  margin: 0;
  border-top: 0px;

  /* Pad so that while the background touches the top, the actual notificaiton content
     isn't squished up against the edges
  */
  padding: calc(${horizontalPaddingFormula});
  padding-top: 3vh;
  padding-bottom: 3vh;

  /*
    Create a flex-box column to center content
  */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`;

export const PageTopNotificationBarContent = styled.div`
  display: block;
  font-size: 1.25rem;
`;

const NudgeTitle = styled.h2`
`;

export const MicrosoftWindowsNudgeCotent = () => (
  <>
    <NudgeTitle>
      Install DiceKeys for Windows?
    </NudgeTitle>
    <ul>
      <li>Save DiceKeys on your computer.</li>
      <li>Seed SoloKeys with a master secret from your DiceKey.</li>
      <li>Just like our web-based app, it is open source and has no advertising or trackers.</li>
    </ul>
  </>
);

export const AppleStoreNudgeContent = () => (
  <>
    <NudgeTitle>
      Install DiceKeys for {OperatingSystemName} from the Apple App Store?
    </NudgeTitle>
    <ul>
      <li>Save DiceKeys on your {OperatingSystemName === "MacOS" ? "Mac" : "iPad or iPhone"}.</li>
      { OperatingSystemName !== "iOS" ? (
        <li>Seed SoloKeys with a master secret from your DiceKey.</li>
      ) : null}
      <li>Just like our web-based app, it is open source and has no advertising or trackers.</li>
    </ul>
  </>
);

export const GooglePlayStoreNudgeContent = () => (
  <>
    <NudgeTitle>
      Install DiceKeys for {OperatingSystemName} from the Google Play Store?
    </NudgeTitle>
    <ul>
      <li>Save DiceKeys on your Android phone, tablet, or other device.</li>
      <li>Seed SoloKeys with a master secret from your DiceKey.</li>
      <li>Just like our web-based app, it is open source and has no advertising or trackers.</li>
    </ul>
  </>
);



export const AppStoreInstallNudgeView = observer( ( {
  state = AppStoreInstallNudgeState,
}:
 {state?: AppStoreInstallNudgeState }) => {
   const {showInstallNudge} = state;
   if (!showInstallNudge) return null;
   return (
      <PageTopNotificationBarContainer>
        <PageTopNotificationBarContent>{
            AppStoreName === "Apple" ? (<AppleStoreNudgeContent/>) :
            AppStoreName === "GooglePlay" ? (<GooglePlayStoreNudgeContent/>) :
            AppStoreName === "Microsoft" ? (<MicrosoftWindowsNudgeCotent/>) :
            null
        }
        <ButtonRow>
          <label htmlFor="dontaskagain" style={{userSelect: "none"}}>do not ask again</label>
          <input id="dontaskagain" type="checkbox"
            checked={state.dontShowAgainCheckboxIsChecked}
            onClick={state.toggleDontShowAgainCheckboxIsChecked}  
          />
          <PushButton style={{marginLeft: '2vw'}} onClick={state.dismissTheInstallNudge}>not now</PushButton>
          <PushButton style={{marginLeft: '3vw'}} onClick={state.install} >{ AppStoreName === "Microsoft" ? (<>download</>) : (<>Install</>)}</PushButton>
        </ButtonRow>
        </PageTopNotificationBarContent>
      </PageTopNotificationBarContainer>
  );
 });