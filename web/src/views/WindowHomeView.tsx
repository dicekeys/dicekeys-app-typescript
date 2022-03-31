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
import { BUILD_VERSION, BUILD_DATE } from "../vite-build-constants";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "../state";
import { PlatformSupportsSavingToDevice  } from "../state/stores/DiceKeyMemoryStore";

const SubViewButton = styled.button`
  display: flex;
  cursor: grab;
  flex-direction: column;
  align-items: center;
  border: none;
  padding: 0.5rem;
  margin: 0.5rem;
  border-radius: 0.5rem;
  &:hover {
    background-color: rgba(128,128,128,.75);
  }
`;

const SubViewButtonImage = styled.img`
  height: 14vh;
`;

const SubViewButtonCaption = styled.div`
  font-size: min(1.5rem,3.5vh,2.5vw);
  margin-top: min(0.75rem, 0.5vh);
`;

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

interface StoredDiceKeyProps {
  storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice;
  windowNavigationState: WindowTopLevelNavigationState;
}

const StoredDiceKeyButtons  = observer ( ({storedDiceKeyDescriptor, windowNavigationState}: StoredDiceKeyProps) => {
  const removeFromMemory = () => { DiceKeyMemoryStore.removeDiceKeyForKeyId(storedDiceKeyDescriptor.keyId) };
  const navigateToDeleteFromDevice = () => { windowNavigationState.navigateToDeleteFromDevice(storedDiceKeyDescriptor) };
  const navigateToSaveToDevice = () => { windowNavigationState.navigateToSaveToDevice(storedDiceKeyDescriptor) };
  if (!PlatformSupportsSavingToDevice) {
    // For platforms that don't support saving DiceKeys to long-term device storage,
    // we can only allow the DiceKey currrently in memory to be removed.
    return (
      <button onClick={removeFromMemory} >remove</button>
    )
  }
  if (storedDiceKeyDescriptor.savedOnDevice) {
    // As this DiceKey is already saved to the device, we can offer the option to remove it from the device.
    return (
      <button onClick={navigateToDeleteFromDevice} >delete</button>
    )
  } else {
    return (
      <button onClick={navigateToSaveToDevice} >save</button>
    )
  }
})

// FIXME -- move to common timer for all in-memory DiceKeys
const StoredDiceKeyView = observer ( (props: StoredDiceKeyProps) => {
  const {storedDiceKeyDescriptor, windowNavigationState} = props;
  return (
    <div key={storedDiceKeyDescriptor.keyId}>
      <SubViewButton
        onClick={() => windowNavigationState.loadStoredDiceKey(storedDiceKeyDescriptor)}
      >
        <DiceKeyView
          size={`${cssCalcTyped(`min(${cssExprWithoutCalc(`50vw`)},${cssExprWithoutCalc(`20vh`)})`)}`}
          faces={ facesFromPublicKeyDescriptor(storedDiceKeyDescriptor) }
          obscureAllButCenterDie={true}
          showLidTab={true}
        />
        <SubViewButtonCaption>{
          `Key ${storedDiceKeyDescriptor.centerFaceLetter}${storedDiceKeyDescriptor.centerFaceDigit}`
        }</SubViewButtonCaption>
      </SubViewButton>
      <div><StoredDiceKeyButtons {...props} /></div>
      <div>(erases automaticaly in {windowNavigationState.autoEraseCountdownTimer?.secondsRemaining}s)</div>
    </div>
  )
});

export const WindowHomeView = observer ( ({windowNavigationState}: {windowNavigationState: WindowTopLevelNavigationState}) => {
  return (
    <PrimaryView>
      <VersionInformationBar>Version { BUILD_VERSION}, { BUILD_DATE }</VersionInformationBar>
      <WindowHomeNavigationBar state={windowNavigationState} />
      <ColumnCentered>
        {/*
          Row of stored DiceKeys
        */}
        <StoredDiceKeysRow>{
          DiceKeyMemoryStore.keysInMemoryOrSavedToDevice.map( storedDiceKeyDescriptor => (
            <StoredDiceKeyView key={storedDiceKeyDescriptor.keyId} {...{windowNavigationState, storedDiceKeyDescriptor}} />
          ))
        }</StoredDiceKeysRow>
        {/* 
          Load DiceKey button
        */}
        <SubViewButton
          onClick={ windowNavigationState.navigateToLoadDiceKey }
        >
          <SubViewButtonImage src={LoadDiceKeyImage} />
          <SubViewButtonCaption>Load DiceKey</SubViewButtonCaption>
        </SubViewButton>
        {/* 
          Assembly instructions button
        */}
        <SubViewButton
          onClick={ windowNavigationState.navigateToAssemblyInstructions }
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
