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

export const ContentRegion = styled(WindowRegionBelowTopNavigationBar)`
  flex: 0 0 auto;
  margin-left: 5vw;
  margin-right: 5vw;
  width: 90vw;
`;

const IdealMinimumContentMargin = `2rem`;
const diceKeySize = `min(100vw - 2 * ${IdealMinimumContentMargin}, ( ${HeightBelowTopNavigationBar} - (${IdealMinimumContentMargin}) )/3)` as const;
const calcDiceKeySize = cssCalcTyped(diceKeySize);

export const SaveDiceKeyStateName = "save";
export const DeleteDiceKeyStateName = "delete";
export type SaveOrDeleteDiceKeyStateName = typeof SaveDiceKeyStateName | typeof DeleteDiceKeyStateName;
export class SaveOrDeleteDiceKeyState implements ViewState {
  readonly navState: NavigationPathState;

  constructor(
    public readonly viewName: SaveOrDeleteDiceKeyStateName,
    parentNavState: NavigationPathState,
    public readonly diceKey: DiceKeyWithKeyId
  ) {
    this.navState = new NavigationPathState(parentNavState, `${this.viewName}/${diceKey.centerLetterAndDigit}`);
  }
}


export const SaveDiceKeyToDeviceStorageView = observer( ( {state, closeFn}:
 {state: SaveOrDeleteDiceKeyState, closeFn: () => void }) => {
  const {diceKey} = state;
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
      </ContentRegion>
    </PageAsFlexColumn>
  );

 });

 
export const DeleteDiceKeyFromDeviceStroageView = observer( (
  {state, closeFn}: {state: SaveOrDeleteDiceKeyState, closeFn: () => void }) => {
  const {diceKey} = state;
  const deleteFromDeviceStorageAndMemory = () => {
    DiceKeyMemoryStore.deleteKeyIdFromDeviceStorageAndMemory(diceKey.keyId);
    closeFn();
  }
    
  return (
    <PageAsFlexColumn>
      <NavigationBarForDiceKey diceKey={diceKey} goBack={closeFn} />
      <ContentRegion>
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
      </ContentRegion>
    </PageAsFlexColumn>
  );

});

// export const SaveOrDeleteDiceKeyView = observer( (props: {state: SaveOrDeleteDiceKeyState, closeFn: () => void }) => {
//   const {diceKey} = props.state;
//   if (DiceKeyMemoryStore.hasKeyInEncryptedStore(diceKey.keyId)) {
//     return (<DeleteDiceKeyFromDeviceStroageView {...{...props}}/>);
//   } else {
//     return (<SaveDiceKeyToDeviceStorageView {...{...props}}/>);
//   }
// });
