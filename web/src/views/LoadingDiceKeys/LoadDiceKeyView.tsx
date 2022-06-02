import React from "react";
import {
  ScanDiceKeyView
} from "./ScanDiceKeyView";
import {
  EnterDiceKeyView} from "./EnterDiceKeyView"
import { observer } from "mobx-react";
import { CenteredControls, CenterColumn, Instruction, Spacer } from "../basics";
import { PushButton } from "../../css/Button";
import { SimpleTopNavBar } from "../../views/Navigation/SimpleTopNavBar";
import { WindowRegionBelowTopNavigationBarWithSideMargins } from "../Navigation/NavigationLayout";
import { LoadDiceKeyViewState, Mode } from "./LoadDiceKeyViewState";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";

type LoadDiceKeyProps = {
  onDiceKeyReadOrCancelled: (diceKey: DiceKeyWithKeyId | undefined, howRead: Mode | "cancelled") => any,
  state: LoadDiceKeyViewState
};

const LoadDiceKeySubView = observer( (props: LoadDiceKeyProps ) => {
  switch(props.state.mode) {
    case "camera": return (
        <CenterColumn>
          <Instruction>Place your DiceKey into the camera's field of view.</Instruction>
          <ScanDiceKeyView
            height="70vh"
            showBoxOverlay={true}
            onDiceKeyRead={ (diceKey) => props.onDiceKeyReadOrCancelled( diceKey, "camera") }
            editManually={ () => props.state.setMode("manual") }
          />
        </CenterColumn>
    );
    case "manual": return (
      <EnterDiceKeyView state={props.state.enterDiceKeyState} />
    );
  }
});


export const LoadDiceKeyContentPaneView = observer( (props: LoadDiceKeyProps) => {
  const {state, onDiceKeyReadOrCancelled} = props;

  const onDonePressedWithinEnterDiceKey = () => {
    const diceKey = state.enterDiceKeyState.diceKey;
    if (state.mode === "manual" &&  diceKey) {
      diceKey.withKeyId.then( diceKey => props.onDiceKeyReadOrCancelled(diceKey, "manual") );
    }
  }

  return (
    <>
      <Spacer/>
      <LoadDiceKeySubView {...props} {...{state}} />
      <CenteredControls>
        { onDiceKeyReadOrCancelled ? (
          <PushButton onClick={ () => onDiceKeyReadOrCancelled(undefined, "cancelled") } >Cancel</PushButton>          
        ) : null }
        <PushButton onClick={ () => state.setMode(state.mode === "camera" ? "manual" : "camera") } >{state.mode !== "camera" ? "Use Camera" : "Enter Manually"}</PushButton>        
        <PushButton
          invisible={state.mode !== "manual" || !state.enterDiceKeyState.isValid}
          onClick={ onDonePressedWithinEnterDiceKey }
        >Done</PushButton>          
      </CenteredControls>
      <Spacer/>
    </>
  )});


export const LoadDiceKeyFullPageView = observer( (props: LoadDiceKeyProps) => {
  const {state} = props;
  return (
    <>
      <SimpleTopNavBar title={ state.mode === "manual" ? "Enter your DiceKey" : "Scan your DiceKey"} />
      <WindowRegionBelowTopNavigationBarWithSideMargins>
        <LoadDiceKeyContentPaneView {...props} />
      </WindowRegionBelowTopNavigationBarWithSideMargins>
    </>
  )});
