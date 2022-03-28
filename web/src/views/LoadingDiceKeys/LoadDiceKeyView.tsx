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
import { PrimaryView } from "../../css/Page";
import { SimpleTopNavBar } from "../../views/Navigation/SimpleTopNavBar";
import { WindowRegionBelowTopNavigationBarWithSideMargins } from "../Navigation/NavigationLayout";
import { NavState, ViewState } from "../../state/core/ViewState";
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

  navState: NavState;
  constructor(parentNavState: NavState = NavState.root, mode: Mode = "camera") {
    this.navState = new NavState(parentNavState, LoadDiceKeyViewStateName)
    this.mode = mode;
    makeAutoObservable(this);
  }
}

type LoadDiceKeyProps = {
  onDiceKeyRead: (diceKey: DiceKeyWithKeyId, howRead: Mode) => any,
  onCancelled?: () => any,
  state: LoadDiceKeyViewState
};

const LoadDiceKeySubView = observer( (props: LoadDiceKeyProps ) => {
  switch(props.state.mode) {
    case "camera": return (
        <CenterColumn>
          <Instruction>Place your DiceKey into the camera's field of view.</Instruction>
          <ScanDiceKeyView
            maxHeight="70vh"
            showBoxOverlay={true}
            onDiceKeyRead={ (diceKey) => props.onDiceKeyRead( diceKey, "camera") }
          />
        </CenterColumn>
    );
    case "manual": return (
      <EnterDiceKeyView state={props.state.enterDiceKeyState} />
    );
  }
  return null;
});


export const LoadDiceKeyView = observer( (props: LoadDiceKeyProps) => {
  const {state, onCancelled} = props;

  const onDonePressedWithinEnterDiceKey = () => {
    const diceKey = state.enterDiceKeyState.diceKey;
    if (state.mode === "manual" &&  diceKey) {
      diceKey.withKeyId.then( diceKey => props.onDiceKeyRead(diceKey, "manual") );
    }
  }

  return (
    <PrimaryView>
      <SimpleTopNavBar title={ state.mode === "manual" ? "Enter your DiceKey" : "Scan your DiceKey"} />
      <WindowRegionBelowTopNavigationBarWithSideMargins>
      <Spacer/>
      <LoadDiceKeySubView {...props} {...{state}} />
      <CenteredControls>
        { onCancelled ? (
          <PushButton onClick={ onCancelled } >Cancel</PushButton>          
        ) : null }
        <PushButton onClick={ () => state.setMode(state.mode === "camera" ? "manual" : "camera") } >{state.mode !== "camera" ? "Use Camera" : "Enter Manually"}</PushButton>        
        <PushButton
          invisible={state.mode !== "manual" || !state.enterDiceKeyState.isValid}
          onClick={ onDonePressedWithinEnterDiceKey }
        >Done</PushButton>          
      </CenteredControls>
      <Spacer/>
      </WindowRegionBelowTopNavigationBarWithSideMargins>
    </PrimaryView>
  )});
