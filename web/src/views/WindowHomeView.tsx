import { observer } from "mobx-react";
import React from "react";
import {WindowTopLevelNavigationState} from "../state/Window";

import LoadDiceKeyImage from "../images/Scanning a DiceKey.svg";
import AssemblyImage1 from "../images/Illustration of shaking bag.svg";
import AssemblyImage2 from "../images/Box Bottom After Roll.svg";
import AssemblyImage3 from "../images/Seal Box.svg";
import { ColumnCentered } from "./basics";
import styled from "styled-components";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { cssCalcTyped, cssExprWithoutCalc } from "../utilities";
import { facesFromPublicKeyDescriptor } from "../dicekeys/DiceKey";
import { WindowHomeNavigationBar } from "./WindowHomeNavigationBar";
import { BUILD_VERSION, BUILD_DATE, RUNNING_IN_ELECTRON } from "../vite-build-constants";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "../state";
import { PlatformSupportsSavingToDevice  } from "../state/stores/DiceKeyMemoryStore";
import { SubViewButton, SubViewButtonCaption, SubViewButtonImage } from "../css/SubViewButton";
import { ButtonRow, PushButton } from "../css/Button";
import { AnchorButton } from "./basics/AnchorButton";
import { AppStoreInstallNudgeView } from "./AppStoreInstallNudgeView";

const ImageRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const StoredDiceKeysRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  max-width: 90vw;
  overflow-x: auto;
`

const VersionInformationBar = styled.div`
  position: absolute;
  z-index: 0;
  left: 0px;
  bottom: 0px;
  /* background color that is equally offset from black or white background */
  background-color: rgba(128,128,128,0.1);
  color: ${ props => props.theme.colors.foregroundDeemphasized};
  padding-bottom: 2px;
  padding-left: 4px;
  padding-top: 4px;
  padding-right: 4px;
  border-top-right-radius: 4px;
  font-size: min(0.8rem,3vh,3vw);
`

interface TopLevelNavigationProps {
  state: WindowTopLevelNavigationState;
}

interface StoredDiceKeyProps extends TopLevelNavigationProps {
  storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice;
}

const storedKeySize = `min(${cssExprWithoutCalc(`50vw`)},${cssExprWithoutCalc(`20vh`)})` as const;

// Top put the buttons for saving/deleting/removing DiceKeys
// closer to the DiceKeys themselves, remove some margins
const ButtonRowBelowDiceKeySubViewButton = styled(ButtonRow)`
  margin-top: 0;
`
const DiceKeyActionButton = styled(PushButton)`
  margin-top: 0;
`

const StoredDiceKeyButtonsView = observer ( ({storedDiceKeyDescriptor, state}: StoredDiceKeyProps) => {
  const removeFromMemory = () => { DiceKeyMemoryStore.removeDiceKey(storedDiceKeyDescriptor) };
  if (!PlatformSupportsSavingToDevice) {
    // For platforms that don't support saving DiceKeys to long-term device storage,
    // we can only allow the DiceKey currently in memory to be removed.
    return (
      <><DiceKeyActionButton onClick={removeFromMemory} >remove</DiceKeyActionButton></>
    )
  }
  if (storedDiceKeyDescriptor.savedOnDevice) {
    // As this DiceKey is already saved to the device, we can offer the option to remove it from the device.
    const navigateToDeleteFromDevice = () => { state.navigateToDeleteFromDevice(storedDiceKeyDescriptor) };
    return (
      <><DiceKeyActionButton onClick={navigateToDeleteFromDevice} >delete</DiceKeyActionButton></>
    )
  } else {
    const navigateToSaveToDevice = () => { state.navigateToSaveToDevice(storedDiceKeyDescriptor) };
    return (
      <><DiceKeyActionButton onClick={navigateToSaveToDevice} ><b>save</b></DiceKeyActionButton><DiceKeyActionButton onClick={removeFromMemory} >remove</DiceKeyActionButton></>
    )
  }
});

const StoredDiceKeyViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const StoredDiceKeyView = observer ( (props: StoredDiceKeyProps) => {
  const {storedDiceKeyDescriptor, state} = props;
  return (
    <StoredDiceKeyViewContainer key={storedDiceKeyDescriptor.keyId}>
      <SubViewButton
        onClick={() => state.loadStoredDiceKey(storedDiceKeyDescriptor)}
      >
        <DiceKeyView
          $size={`${cssCalcTyped(storedKeySize)}`}
          faces={ facesFromPublicKeyDescriptor(storedDiceKeyDescriptor) }
          obscureAllButCenterDie={true}
          showLidTab={true}
        />
        <SubViewButtonCaption>{
          `Key ${storedDiceKeyDescriptor.centerLetterAndDigit}`
        }</SubViewButtonCaption>
      </SubViewButton>
      <ButtonRowBelowDiceKeySubViewButton>
        <StoredDiceKeyButtonsView {...props} />
      </ButtonRowBelowDiceKeySubViewButton>
    </StoredDiceKeyViewContainer>
  )
});

const unsaved = PlatformSupportsSavingToDevice ? "unsaved " : "";
const CountdownTimerLine = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  font-size: calc(min(1.2rem, 2vh, 1.9vw));
  overflow: hidden;
`;

const CountdownTimerView = observer( ({state}: TopLevelNavigationProps) => {
  const numberOfKeysOnlyInMemory = DiceKeyMemoryStore.keysOnlyInMemory.length;
  if (numberOfKeysOnlyInMemory === 0) return null;
  const objectNames = (numberOfKeysOnlyInMemory === 1 ? `The ${unsaved}DiceKey ` : `All ${unsaved}DiceKeys ` );
  if (state.autoEraseDisabled) {
    return (
      <CountdownTimerLine>
        {objectNames} above will remain in memory until removed
        { RUNNING_IN_ELECTRON ?
          (<> or the application is closed.</>) :
          (<>, this tab is refreshed, or this tab is closed.</>)}
        &nbsp;&nbsp;<AnchorButton onClick={state.enableAutoErase}>start auto-erase timer</AnchorButton>
      </CountdownTimerLine>
    )
  }
  return (
    <CountdownTimerLine>
      {objectNames} above will be automatically removed from memory in {state.autoEraseCountdownTimer?.secondsRemaining}s.
      &nbsp;&nbsp;<AnchorButton onClick={state.disableAutoErase}>do not erase automatically</AnchorButton>
    </CountdownTimerLine>
  )
})

const StoredDiceKeysRowAndCountdownTimerContainer = styled.div`
`

export const WindowHomeView = observer ( ({state}: TopLevelNavigationProps) => {
  return (
    <>
      <AppStoreInstallNudgeView/>
      <VersionInformationBar>Release { BUILD_VERSION}, { BUILD_DATE }</VersionInformationBar>
      <WindowHomeNavigationBar state={state} />
      <ColumnCentered>
        {/*
          Row of stored DiceKeys
        */}
        <StoredDiceKeysRowAndCountdownTimerContainer>
          <StoredDiceKeysRow>{
            DiceKeyMemoryStore.keysInMemoryOrSavedToDevice.map( storedDiceKeyDescriptor => (
              <StoredDiceKeyView key={storedDiceKeyDescriptor.keyId} {...{state, storedDiceKeyDescriptor}} />
            ))
          }</StoredDiceKeysRow>
          <CountdownTimerView {...{state}} />
        </StoredDiceKeysRowAndCountdownTimerContainer>
        {/* 
          Load DiceKey button
        */}
        <SubViewButton
          onClick={ state.navigateToLoadDiceKey }
        >
          <SubViewButtonImage src={LoadDiceKeyImage} />
          <SubViewButtonCaption>Load DiceKey</SubViewButtonCaption>
        </SubViewButton>
        {/* 
          Assembly instructions button
        */}
        <SubViewButton
          onClick={ state.navigateToAssemblyInstructions }
        >
          <ImageRow>
            <SubViewButtonImage src={AssemblyImage1} />
            <SubViewButtonImage src={AssemblyImage2} />
            <SubViewButtonImage src={AssemblyImage3} />
          </ImageRow>
          <SubViewButtonCaption>Assembly Instructions</SubViewButtonCaption>
        </SubViewButton>
        </ColumnCentered>
      </>
    )
});
