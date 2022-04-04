import { observer } from "mobx-react";
import React from "react";
import {WindowTopLevelNavigationState} from "../state/Window";

import LoadDiceKeyImage from "../images/Scanning a DiceKey.svg";
import AssemblyImage1 from "../images/Illustration of shaking bag.svg";
import AssemblyImage2 from "../images/Box Bottom After Roll.svg";
import AssemblyImage3 from "../images/Seal Box.svg";
import { PrimaryView } from "../css/Page";
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
import { EventHandlerOverridesDefault } from "../utilities/EventHandlerOverridesDefault";

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

const StoredDiceKeyButtonsView = observer ( ({storedDiceKeyDescriptor, state}: StoredDiceKeyProps) => {
  const removeFromMemory = () => { DiceKeyMemoryStore.removeDiceKey(storedDiceKeyDescriptor) };
  if (!PlatformSupportsSavingToDevice) {
    // For platforms that don't support saving DiceKeys to long-term device storage,
    // we can only allow the DiceKey currrently in memory to be removed.
    return (
      <ButtonRow><PushButton onClick={removeFromMemory} >remove</PushButton></ButtonRow>
    )
  }
  if (storedDiceKeyDescriptor.savedOnDevice) {
    // As this DiceKey is already saved to the device, we can offer the option to remove it from the device.
    const navigateToDeleteFromDevice = () => { state.navigateToDeleteFromDevice(storedDiceKeyDescriptor) };
    return (
      <ButtonRow><PushButton onClick={navigateToDeleteFromDevice} >delete</PushButton></ButtonRow>
    )
  } else {
    const navigateToSaveToDevice = () => { state.navigateToSaveToDevice(storedDiceKeyDescriptor) };
    return (
      <ButtonRow><PushButton onClick={navigateToSaveToDevice} ><b>save</b></PushButton><PushButton onClick={removeFromMemory} >remove</PushButton></ButtonRow>
    )
  }
});

const StoredDiceKeyViewContainer = styled.div`
`;

const StoredDiceKeyView = observer ( (props: StoredDiceKeyProps) => {
  const {storedDiceKeyDescriptor, state} = props;
  return (
    <StoredDiceKeyViewContainer key={storedDiceKeyDescriptor.keyId}>
      <SubViewButton
        onClick={() => state.loadStoredDiceKey(storedDiceKeyDescriptor)}
      >
        <DiceKeyView
          size={`${cssCalcTyped(storedKeySize)}`}
          faces={ facesFromPublicKeyDescriptor(storedDiceKeyDescriptor) }
          obscureAllButCenterDie={true}
          showLidTab={true}
        />
        <SubViewButtonCaption>{
          `Key ${storedDiceKeyDescriptor.centerLetterAndDigit}`
        }</SubViewButtonCaption>
      </SubViewButton>
      <StoredDiceKeyButtonsView {...props} />
    </StoredDiceKeyViewContainer>
  )
});

const unsaved = PlatformSupportsSavingToDevice ? "unsaved " : "";
const CountdownTimerLine = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
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
        &nbsp;&nbsp;<a href="#" onClick={EventHandlerOverridesDefault(state.enableAutoErase)}>start auto-erase timer</a>
      </CountdownTimerLine>
    )
  }
  return (
    <CountdownTimerLine>
      {objectNames} above will be automatically removed from memory in {state.autoEraseCountdownTimer?.secondsRemaining}s.
      &nbsp;&nbsp;<a href="#" onClick={EventHandlerOverridesDefault(state.disableAutoErase)}>do not erase automatically</a>
    </CountdownTimerLine>
  )
})

export const WindowHomeView = observer ( ({state}: TopLevelNavigationProps) => {
  return (
    <PrimaryView>
      <VersionInformationBar>Version { BUILD_VERSION}, { BUILD_DATE }</VersionInformationBar>
      <WindowHomeNavigationBar state={state} />
      <ColumnCentered>
        {/*
          Row of stored DiceKeys
        */}
        <div>
          <StoredDiceKeysRow>{
            DiceKeyMemoryStore.keysInMemoryOrSavedToDevice.map( storedDiceKeyDescriptor => (
              <StoredDiceKeyView key={storedDiceKeyDescriptor.keyId} {...{state, storedDiceKeyDescriptor}} />
            ))
          }</StoredDiceKeysRow>
          <CountdownTimerView {...{state}} />
        </div>
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
      </PrimaryView>
    )
});
