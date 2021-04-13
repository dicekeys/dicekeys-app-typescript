import React from "react";
import {
  ScanDiceKeyView
} from "./ScanDiceKeyView";
import {
  EnterDiceKeyView, EnterDiceKeyState
} from "./EnterDiceKeyView"
import { DiceKey } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import { CenteredControls } from "../basics";


type Mode = "camera" | "manual";

export class LoadDiceKeyState {
  mode: Mode;
  enterDiceKeyState = new EnterDiceKeyState()

  setMode = action( (mode: Mode) => {
    this.mode = mode;
  });

  constructor(mode: Mode = "camera") {
    this.mode = mode;
    makeAutoObservable(this);
  }
}

type LoadDiceKeyProps = {
  onDiceKeyRead: (diceKey: DiceKey, howRead: Mode) => any,
  onCancelled?: () => any,
  state: LoadDiceKeyState
};

const LoadDiceKeySubView = observer( (props: LoadDiceKeyProps ) => {
  switch(props.state.mode) {
    case "camera": return ( 
      <ScanDiceKeyView onDiceKeyRead={ (diceKey) => props.onDiceKeyRead( diceKey.map( faceRead => faceRead.toFace()) as DiceKey, "camera") }/>
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
      props.onDiceKeyRead(diceKey, "manual");
    }
  }

  return (
    <div>
      <LoadDiceKeySubView {...props} {...{state}} />
      <CenteredControls>
        { onCancelled ? (
          <button onClick={ onCancelled() } >Cancel</button>          
        ) : null }
        <button onClick={ () => state.setMode(state.mode === "camera" ? "manual" : "camera") } >{state.mode !== "camera" ? "Use Camera" : "Enter Manually"}</button>        
        <button hidden={state.mode !== "manual" || !state.enterDiceKeyState.isValid} onClick={ onDonePressedWithinEnterDiceKey } >Done</button>          
      </CenteredControls>
    </div>
)});
