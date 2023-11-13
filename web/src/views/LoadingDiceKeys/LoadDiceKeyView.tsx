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
  onDiceKeyReadOrCancelled: (diceKey: DiceKeyWithKeyId | undefined, howRead: Mode | "cancelled") => void;
  state: LoadDiceKeyViewState;
  instruction?: JSX.Element | string;
  scanViewHeight?: string;
};

const LoadDiceKeySubView = observer( ({
  state,
  onDiceKeyReadOrCancelled,
  instruction = `Place your DiceKey into the camera's field of view.`,
  scanViewHeight = `70vh`,
}: LoadDiceKeyProps ) => {
  switch(state.mode) {
    case "camera": return (
        <CenterColumn>
          <Instruction>{ instruction }</Instruction>
          <ScanDiceKeyView
            height={scanViewHeight}
            showBoxOverlay={true}
            onDiceKeyRead={ (diceKey) => onDiceKeyReadOrCancelled( diceKey, "camera") }
            editManually={ () => state.setMode("manual") }
          />
        </CenterColumn>
    );
    case "manual": return (
      <EnterDiceKeyView state={state.enterDiceKeyState} />
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
