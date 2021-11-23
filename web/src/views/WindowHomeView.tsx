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
import {RUNNING_IN_ELECTRON} from "../utilities/is-electron";
import { EncryptedDiceKeyStore } from "../state/stores/EncryptedDiceKeyStore";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { cssCalcTyped, cssCalcInputExpr } from "../utilities";
import { facesFromPublicKeyDescriptor } from "../dicekeys/DiceKey";
import { WindowHomeNavigationBar } from "./WindowHomeNavigationBar";

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
  height: 13vh;
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

interface WindowHomeViewProps {
  windowNavigationState: WindowTopLevelNavigationState;
}
export const WindowHomeView = observer ( (props: WindowHomeViewProps) => {
  const {windowNavigationState} = props;
  const storedDiceKeys = RUNNING_IN_ELECTRON ?
    EncryptedDiceKeyStore.storedDiceKeys : [];
  return (
    <PrimaryView>
      <WindowHomeNavigationBar state={windowNavigationState} />
      <ColumnCentered>
        { (!RUNNING_IN_ELECTRON || storedDiceKeys.length === 0) ? null : (
          <StoredDiceKeysRow>{
            storedDiceKeys.map( storedDiceKeyDescriptor => (
              <SubViewButton
                onClick={async () => {
                  const diceKey = await EncryptedDiceKeyStore.load(storedDiceKeyDescriptor);
                  if (diceKey != null) {
                    windowNavigationState.navigateToSelectedDiceKeyView(diceKey);
                  } else {
                    console.log(`EncryptedDiceKeyStore.load returned null`)
                  }
                }}
              >
                <DiceKeyView
                  size={`${cssCalcTyped(`min(${cssCalcInputExpr(`50vw`)},${cssCalcInputExpr(`20vh`)})`)}`}
                  faces={ facesFromPublicKeyDescriptor(storedDiceKeyDescriptor) }
                  obscureAllButCenterDie={true}
                  showLidTab={true}
                />
                <SubViewButtonCaption>{
                  `Open Key ${storedDiceKeyDescriptor.centerFaceLetter}${storedDiceKeyDescriptor.centerFaceDigit}`
                }</SubViewButtonCaption>
              </SubViewButton>
            ))
          }</StoredDiceKeysRow>
        )}
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
