import React from "react";
import {
  ScanDiceKeyView
} from "./ScanDiceKeyView";
import {
  EnterDiceKeyView
} from "./EnterDiceKeyView";
import { observer } from "mobx-react";
import { CenteredControls, CenterColumn, Instruction, Spacer, Instruction2 } from "../basics";
import { PushButton } from "../../css/Button";
import { SimpleTopNavBar } from "../../views/Navigation/SimpleTopNavBar";
import { WindowRegionBelowTopNavigationBarWithSideMargins } from "../Navigation/NavigationLayout";
import { LoadDiceKeyViewState, Mode } from "./LoadDiceKeyViewState";
import { DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";

type LoadDiceKeyProps = {
  onDiceKeyReadOrCancelled: (resultIfRead?: {
    diceKey: DiceKeyWithoutKeyId,
    howRead: Mode
  } | undefined) => void;
  state: LoadDiceKeyViewState;
  instruction?: JSX.Element | string;
  scanViewHeight?: string;
};

const LoadDiceKeySubView = observer( ({
  state,
  onDiceKeyReadOrCancelled,
  instruction,
  scanViewHeight = `70vh`,
}: LoadDiceKeyProps ) => {
  switch(state.mode) {
    case "camera": return (
        <CenterColumn>
          <Instruction>Place your DiceKey into the camera's field of view.</Instruction>
          { instruction == null ? null : (<Instruction2>{instruction}</Instruction2>) }
          <ScanDiceKeyView
            height={scanViewHeight}
            showBoxOverlay={true}
            onDiceKeyRead={ (diceKey) =>
              onDiceKeyReadOrCancelled(diceKey == null ? diceKey : {diceKey, howRead: "camera"}) }
            editManually={ () => state.setMode("manual") }
          />
        </CenterColumn>
    );
    case "manual": return (
      <EnterDiceKeyView state={state.enterDiceKeyState} instruction={instruction} />
    );
  }
});


export const LoadDiceKeyContentPaneView = observer( (props: LoadDiceKeyProps) => {
  const {state, onDiceKeyReadOrCancelled} = props;

  const onDonePressedWithinEnterDiceKey = () => {
    const diceKey = state.enterDiceKeyState.diceKey;
    if (state.mode === "manual" &&  diceKey) {
      props.onDiceKeyReadOrCancelled({diceKey, howRead: "manual"});
    }
  }

  return (
    <>
      <Spacer/>
      <LoadDiceKeySubView {...props} {...{state}} />
      <CenteredControls>
        { onDiceKeyReadOrCancelled ? (
          <PushButton onClick={ () => onDiceKeyReadOrCancelled() } >Cancel</PushButton>          
        ) : null }
        <PushButton onClick={ () => state.setMode(state.mode === "camera" ? "manual" : "camera") } >{state.mode !== "camera" ? "Use Camera" : "Enter Manually"}</PushButton>        
        <PushButton
          $invisible={state.mode !== "manual" || !state.enterDiceKeyState.isValid}
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
