import { observer } from "mobx-react";
import React from "react";
import {WindowTopLevelNavigationState} from "../state/Window";

import LoadDiceKeyImage from /*url:*/"../images/Scanning a DiceKey.svg";
import AssemblyImage1 from /*url:*/"../images/Illustration of shaking bag.svg";
import AssemblyImage2 from /*url:*/"../images/Box Bottom After Roll.svg";
import AssemblyImage3 from /*url:*/"../images/Seal Box.svg";
import { PrimaryView } from "../css/Page";
import { ColumnCentered } from "./basics";
import styled from "styled-components";

const SubViewButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  border: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  &:hover {
    background-color: rgba(128,128,128,.75);
  }
`;


const SubViewButtonImage = styled.img`
  height: 15vh;
`;

const SubViewButtonCaption = styled.div`
  font-size: 1.5rem;
  margin-top: 1rem;
`;

const ImageRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

interface WindowHomeViewProps {
  windowNavigationState: WindowTopLevelNavigationState;
}
export const WindowHomeView = observer ( (props: WindowHomeViewProps) => {
  const {windowNavigationState} = props;
  return (
    <PrimaryView>
      <ColumnCentered>
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
