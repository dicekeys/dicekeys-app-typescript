import React from "react";
import {
  ScanDiceKeyView
} from "./ScanDiceKeyView";
import {
  EnterDiceKeyView, EnterDiceKeyState
} from "./EnterDiceKeyView"
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import { CenteredControls, CenterColumn, Instruction, Spacer } from "../basics";
import { PushButton } from "../../css/Button";
import { SimpleTopNavBar } from "../../views/Navigation/SimpleTopNavBar";
import { WindowRegionBelowTopNavigationBarWithSideMargins } from "../Navigation/NavigationLayout";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { PathStrings } from "../../views/Navigation/PathStrings";

type Mode = "camera" | "manual";

export const LoadDiceKeyViewStateName = PathStrings["LoadDiceKey"];
export type LoadDiceKeyViewStateName = typeof LoadDiceKeyViewStateName;
export class LoadDiceKeyViewState implements ViewState {
  readonly viewName = LoadDiceKeyViewStateName;

  mode: Mode;
  enterDiceKeyState = new EnterDiceKeyState()

  setMode = action( (mode: Mode) => {
    this.mode = mode;
  });

  navState: NavigationPathState;
  constructor(parentNavState: NavigationPathState = NavigationPathState.root, mode: Mode = "camera") {
    this.mode = mode;
    this.navState = new NavigationPathState(parentNavState, LoadDiceKeyViewStateName)
    makeAutoObservable(this);
  }
}

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
