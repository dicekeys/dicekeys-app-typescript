import { observer } from "mobx-react";
import React from "react";
import { CenteredControls, ThisDiceKey, Instruction, Spacer } from "./basics";
import { OptionButton } from "../css/Button";
import { DiceKeyMemoryStore } from "../state";
import { NavigationBarForDiceKey } from "./WithSelectedDiceKey/SelectedDiceKeyNavigationBar";
import { HeightBelowTopNavigationBar, WindowRegionBelowTopNavigationBar } from "./Navigation/NavigationLayout";
import styled from "styled-components";
import { cssCalcTyped } from "../utilities";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { addressBarState } from "../state/core/AddressBarState";
import { DeleteDiceKeyViewState, SaveDiceKeyViewState } from "./SaveOrDeleteDiceKeyViewState";

export const ContentRegion = styled(WindowRegionBelowTopNavigationBar)`
  flex: 0 0 auto;
  margin-left: 5vw;
  margin-right: 5vw;
  width: 90vw;
`;

const IdealMinimumContentMargin = `2rem`;
const diceKeySize = `min(100vw - 2 * ${IdealMinimumContentMargin}, ( ${HeightBelowTopNavigationBar} - (${IdealMinimumContentMargin}) )/3)` as const;
const calcDiceKeySize = cssCalcTyped(diceKeySize);

export const SaveDiceKeyToDeviceStorageContentView = observer( ( {
  state,
  closeFn = addressBarState.back
}:
 {state: SaveDiceKeyViewState, closeFn?: () => void }) => {
  const diceKey = state.getDiceKey();
  if (diceKey == null) return null;
  const saveFn = () => {
    DiceKeyMemoryStore.saveToDeviceStorage(diceKey);
    closeFn();
  }
   
   return (
    <>
      <Spacer/>
      <DiceKeyView
      $size={calcDiceKeySize}
      faces={diceKey.faces}
    />
        <Instruction>
          If you save <ThisDiceKey {...{diceKey}}/> on this computer, anyone able to access your user account, and any
          app installed with access to your account, may be able to access this DiceKey. 
        </Instruction>
        <CenteredControls>
        <OptionButton onClick={closeFn}>Cancel</OptionButton>
        <OptionButton onClick={saveFn}>Save</OptionButton>  
      </CenteredControls>
      <Spacer/>
    </>
  );

 });

export const SaveDiceKeyToDeviceStorageView = observer( ( {
  state,
  closeFn = addressBarState.back
}:
 {state: SaveDiceKeyViewState, closeFn?: () => void }) => {
  const diceKey = state.getDiceKey();
  if (diceKey == null) return null;
   
   return (
    <>
      <NavigationBarForDiceKey diceKey={diceKey} goBack={closeFn} />
      <ContentRegion>
        <SaveDiceKeyToDeviceStorageContentView state={state} closeFn={closeFn} />
      </ContentRegion>
    </>
  );
 });

 
export const DeleteDiceKeyToDeviceStorageContentView = observer( (
  {
    state,
    closeFn = addressBarState.back
  }: {state: DeleteDiceKeyViewState, closeFn?: () => void }) => {
    const diceKey = state.getDiceKey();
    if (diceKey == null) return null;

    const deleteFromDeviceStorageAndMemory = () => {
    DiceKeyMemoryStore.deleteFromDeviceStorageAndMemory(diceKey);
    closeFn();
  }
    
  return (
    <>
      <Spacer/>
        <DiceKeyView
          $size={calcDiceKeySize}
          faces={diceKey.faces}
        />
        <Instruction>
          If you delete <ThisDiceKey {...{diceKey}}/> from this computer, you will need to
          scan or enter the physical DiceKey back in when you next need it.
        </Instruction>
        <CenteredControls>
        <OptionButton onClick={closeFn}>Cancel</OptionButton>
        <OptionButton onClick={deleteFromDeviceStorageAndMemory}>Delete</OptionButton>  
      </CenteredControls>
      <Spacer/>
    </>
  );

});

export const DeleteDiceKeyToDeviceStorageView = observer( ( {
  state,
  closeFn = addressBarState.back
}:
 {state: DeleteDiceKeyViewState, closeFn?: () => void }) => {
  const diceKey = state.getDiceKey();
  if (diceKey == null) return null;

   
   return (
    <>
      <NavigationBarForDiceKey diceKey={diceKey} goBack={closeFn} />
      <ContentRegion>
        <DeleteDiceKeyToDeviceStorageContentView state={state} closeFn={closeFn} />
      </ContentRegion>
    </>
  );
 });