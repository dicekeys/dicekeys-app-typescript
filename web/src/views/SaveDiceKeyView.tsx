import { observer } from "mobx-react";
import React from "react";
import { CenteredControls, DiceKeyNickname, Instruction, Spacer } from "./basics";
import { OptionButton } from "../css/Button";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../state";
import { PageAsFlexColumn } from "../css";
import { NavigationBarForDiceKey } from "./WithSelectedDiceKey/SelectedDiceKeyNavigationBar";
import { HeightBelowTopNavigationBar, WindowRegionBelowTopNavigationBar } from "./Navigation/NavigationLayout";
import styled from "styled-components";
import { cssCalcTyped } from "../utilities";
import { DiceKeyView } from "./SVG/DiceKeyView";

export const ContentRegion = styled(WindowRegionBelowTopNavigationBar)`
  flex: 0 0 auto;
`;

const IdealMinimumContentMargin = `2rem`;
const SelectedDiceKeySize = `min(100vw - 2 * ${IdealMinimumContentMargin}, ( ${HeightBelowTopNavigationBar} - (${IdealMinimumContentMargin}) )/2)` as const;
const calcSelectedDiceKeySize = cssCalcTyped(SelectedDiceKeySize);

export const SaveDiceKeyToDeviceStorageView = observer( ( {diceKey, closeFn}:
 {diceKey: DiceKeyWithKeyId, closeFn: () => void }) => {

  const saveFn = () => {
    DiceKeyMemoryStore.saveToDeviceStorage(diceKey);
    closeFn();
  }
   
   return (
    <PageAsFlexColumn>
      <NavigationBarForDiceKey diceKey={diceKey} goBack={closeFn} />
      <ContentRegion>
        <Spacer/>
        <DiceKeyView
        size={calcSelectedDiceKeySize}
        faces={diceKey.faces}
      />
          <Instruction>
            If you save <DiceKeyNickname {...{diceKey}}/> on this device, anyone able to access your account on this device, or any
            app that can run on this device, may be able to access the DiceKey. 
          </Instruction>
          <CenteredControls>
          <OptionButton onClick={closeFn}>Cancel</OptionButton>
          <OptionButton onClick={saveFn}>Save</OptionButton>  
        </CenteredControls>
        <Spacer/>
        </ContentRegion>
    </PageAsFlexColumn>
  );

 });

 
export const DeleteDiceKeyFromDeviceStroageView = observer( (
  {diceKey, closeFn}: {diceKey: DiceKeyWithKeyId, closeFn: () => void }) => {
 
  const deleteFromDeviceStorageAndMemory = () => {
    DiceKeyMemoryStore.deleteKeyIdFromDeviceStorageAndMemory(diceKey.keyId)
  }
    
  return (
    <PageAsFlexColumn>
      <NavigationBarForDiceKey diceKey={diceKey} goBack={closeFn} />
      <ContentRegion>
        <Spacer/>
          <Instruction>
            If you save <DiceKeyNickname {...{diceKey}}/> on this device, anyone able to access your account on this device, or any
            app that can run on this device, may be able to access the DiceKey. 
          </Instruction>
          <CenteredControls>
          <OptionButton onClick={closeFn}>Cancel</OptionButton>
          <OptionButton onClick={deleteFromDeviceStorageAndMemory}>Save</OptionButton>  
        </CenteredControls>
        <Spacer/>
      </ContentRegion>
    </PageAsFlexColumn>
  );

});