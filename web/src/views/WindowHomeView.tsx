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
import { SubViewButton, SubViewButtonCaption, SubViewButtonImage } from "../css/SubViewButton";
import { ButtonRow, PushButton } from "../css/Button";

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


const storedKeySize = `min(${cssExprWithoutCalc(`50vw`)},${cssExprWithoutCalc(`20vh`)})` as const;


const StoredDiceKeyButtons  = observer ( ({storedDiceKeyDescriptor, windowNavigationState}: StoredDiceKeyProps) => {
  const removeFromMemory = () => { DiceKeyMemoryStore.removeDiceKeyForKeyId(storedDiceKeyDescriptor.keyId) };
  if (!PlatformSupportsSavingToDevice) {
    // For platforms that don't support saving DiceKeys to long-term device storage,
    // we can only allow the DiceKey currrently in memory to be removed.
    return (
      <ButtonRow><PushButton onClick={removeFromMemory} >remove</PushButton></ButtonRow>
    )
  }
  if (storedDiceKeyDescriptor.savedOnDevice) {
    // As this DiceKey is already saved to the device, we can offer the option to remove it from the device.
    const navigateToDeleteFromDevice = () => { windowNavigationState.navigateToDeleteFromDevice(storedDiceKeyDescriptor) };
    return (
      <ButtonRow><PushButton onClick={navigateToDeleteFromDevice} >delete</PushButton></ButtonRow>
    )
  } else {
    const navigateToSaveToDevice = () => { windowNavigationState.navigateToSaveToDevice(storedDiceKeyDescriptor) };
    return (
      <ButtonRow><PushButton onClick={navigateToSaveToDevice} ><b>save</b></PushButton><PushButton onClick={removeFromMemory} >remove</PushButton></ButtonRow>
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
          size={`${cssCalcTyped(storedKeySize)}`}
          faces={ facesFromPublicKeyDescriptor(storedDiceKeyDescriptor) }
          obscureAllButCenterDie={true}
          showLidTab={true}
        />
        <SubViewButtonCaption>{
          `Key ${storedDiceKeyDescriptor.centerFaceLetter}${storedDiceKeyDescriptor.centerFaceDigit}`
        }</SubViewButtonCaption>
      </SubViewButton>
      <StoredDiceKeyButtons {...props} />
    </div>
  )
});

export const WindowHomeView = observer ( ({windowNavigationState}: {windowNavigationState: WindowTopLevelNavigationState}) => {
  const numberOfKeysOnlyInMemory = DiceKeyMemoryStore.keysOnlyInMemory.length;
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
        <div>{ numberOfKeysOnlyInMemory === 0 ? null : (<>
          ({ PlatformSupportsSavingToDevice ? 
            (numberOfKeysOnlyInMemory === 1 ? `The unsaved key` : `All unsaved keys` ) :
            (numberOfKeysOnlyInMemory === 1 ? `The DiceKey` : `All DiceKeys` )
          } above will be automatically removed from memory in {windowNavigationState.autoEraseCountdownTimer?.secondsRemaining}s)        
        </>)
        }</div>
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
