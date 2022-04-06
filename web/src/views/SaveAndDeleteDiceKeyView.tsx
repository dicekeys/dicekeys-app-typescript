import { observer } from "mobx-react";
import React from "react";
import { CenteredControls, ThisDiceKey, Instruction, Spacer } from "./basics";
import { OptionButton } from "../css/Button";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../state";
import { PageAsFlexColumn } from "../css";
import { NavigationBarForDiceKey } from "./WithSelectedDiceKey/SelectedDiceKeyNavigationBar";
import { HeightBelowTopNavigationBar, WindowRegionBelowTopNavigationBar } from "./Navigation/NavigationLayout";
import styled from "styled-components";
import { cssCalcTyped } from "../utilities";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { ViewState } from "../state/core/ViewState";
import { NavigationPathState } from "../state/core/NavigationPathState";
import { addressBarState } from "../state/core/AddressBarState";

export const ContentRegion = styled(WindowRegionBelowTopNavigationBar)`
  flex: 0 0 auto;
  margin-left: 5vw;
  margin-right: 5vw;
  width: 90vw;
`;

const IdealMinimumContentMargin = `2rem`;
const diceKeySize = `min(100vw - 2 * ${IdealMinimumContentMargin}, ( ${HeightBelowTopNavigationBar} - (${IdealMinimumContentMargin}) )/3)` as const;
const calcDiceKeySize = cssCalcTyped(diceKeySize);

export const SaveDiceKeyViewStateName = "save";
export const DeleteDiceKeyViewStateName = "delete";
export type SaveDiceKeyViewStateName = typeof SaveDiceKeyViewStateName;
export type DeleteDiceKeyViewStateName = typeof DeleteDiceKeyViewStateName;
export type SaveOrDeleteDiceKeyStateName = SaveDiceKeyViewStateName | DeleteDiceKeyViewStateName;
export class SaveOrDeleteDiceKeyViewState<SAVE_OR_DELETE extends SaveOrDeleteDiceKeyStateName=SaveOrDeleteDiceKeyStateName> implements ViewState {
  readonly navState: NavigationPathState;

  constructor(
    public readonly viewName: SAVE_OR_DELETE,
    parentNavState: NavigationPathState,
    public readonly diceKey: DiceKeyWithKeyId,
    localPath: string | (() => string) = `${viewName}/${diceKey.centerLetterAndDigit}`
  ) {
    this.navState = new NavigationPathState(parentNavState, localPath);
  }
}
export type SaveDiceKeyViewState = SaveOrDeleteDiceKeyViewState<SaveDiceKeyViewStateName>;
export type DeleteDiceKeyViewState = SaveOrDeleteDiceKeyViewState<DeleteDiceKeyViewStateName>;

export const SaveDiceKeyToDeviceStorageContentView = observer( ( {
  state,
  closeFn = addressBarState.back
}:
 {state: SaveDiceKeyViewState, closeFn?: () => void }) => {
  const {diceKey} = state;
  const saveFn = () => {
    DiceKeyMemoryStore.saveToDeviceStorage(diceKey);
    closeFn();
  }
   
   return (
    <>
      <Spacer/>
      <DiceKeyView
      size={calcDiceKeySize}
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
  const {diceKey} = state;
   
   return (
    <PageAsFlexColumn>
      <NavigationBarForDiceKey diceKey={diceKey} goBack={closeFn} />
      <ContentRegion>
        <SaveDiceKeyToDeviceStorageContentView state={state} closeFn={closeFn} />
      </ContentRegion>
    </PageAsFlexColumn>
  );
 });

 
export const DeleteDiceKeyToDeviceStorageContentView = observer( (
  {
    state,
    closeFn = addressBarState.back
  }: {state: DeleteDiceKeyViewState, closeFn?: () => void }) => {
  const {diceKey} = state;
  const deleteFromDeviceStorageAndMemory = () => {
    DiceKeyMemoryStore.deleteFromDeviceStorageAndMemory(diceKey);
    closeFn();
  }
    
  return (
    <>
      <Spacer/>
        <DiceKeyView
          size={calcDiceKeySize}
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
  const {diceKey} = state;
   
   return (
    <PageAsFlexColumn>
      <NavigationBarForDiceKey diceKey={diceKey} goBack={closeFn} />
      <ContentRegion>
        <DeleteDiceKeyToDeviceStorageContentView state={state} closeFn={closeFn} />
      </ContentRegion>
    </PageAsFlexColumn>
  );
 });