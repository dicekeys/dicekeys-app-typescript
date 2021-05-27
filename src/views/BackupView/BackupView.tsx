import { DiceKey, Face } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { StepFooterView } from "../Navigation/StepFooterView";
import { FaceCopyingView } from "../SVG/FaceCopyingView";
import { FaceDigits, FaceLetters, FaceOrientationLettersTrbl } from "@dicekeys/read-dicekey-js";
import { Instruction } from "../basics";
import { addPreviewWithMargins } from "../basics/Previews";
import { BackupMedium } from "./BackupMedium";
import { ValidateBackupView } from "./ValidateBackup";
import { StickerSheetView } from "../SVG/StickerSheetView";
import { StickerTargetSheetView } from "../SVG/StickerTargetSheetView";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";
import stepCSS from "../Navigation/StepFooterView.module.css";
import layoutCSS from "../../css/Layout.module.css";
import {BackupStep, BackupViewState} from "../../state/Window/BackupState";

const commonButtonStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "stretch",
  alignItems: "stretch",
  alignContent: "center",
  paddingTop: "1.5vh",
  paddingBottom: "1.5vh",
  marginTop: "1.5vh",
  marginBottom: "1.5vh",
  borderRadius: "min(1vh,1vw)",
  paddingLeft: "1vw",
  paddingRight: "1vw",
  border: "none"
}

const IntroToBackingUpToADiceKeyView = () => (<>
  <div>
    <Instruction>Open your DiceKey kit and take out the box bottom and the 25 dice.</Instruction>
    <div style={{display: "flex", flexDirection: "row", justifyContent: "center", marginTop: "2rem", marginBottom: "2rem"}}>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginRight: "2vw"}}>
        <DiceKeyViewAutoSized maxHeight="40vh" maxWidth="35vw" />
      </div>
    </div>
    <Instruction>Next, you will replicate the first DiceKey by copying the arrangement of dice.</Instruction>
    <div style={{marginTop: "3rem"}}>Need another DiceKey?  You can <a href="https://dicekeys.com/store">order more</a>.</div>
  </div>
</>)
const IntroToBackingUpToASticKeyView = () => (
  <div>
    <Instruction>Unwrap your SticKeys it.</Instruction>
    <div style={{display: "flex", flexDirection: "row", justifyContent: "center", marginTop: "2rem", marginBottom: "2rem"}}>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginRight: "2vw"}}>
        <StickerSheetView maxHeight="40vh" maxWidth="35vw" />
        5 sticker sheets
      </div>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginLeft: "2vw"}}>
        <StickerTargetSheetView maxHeight="40vh" maxWidth="35vw" />
        1 target sheet
      </div>
    </div>
    <Instruction>Next, you will create a copy of your DiceKey on the target sheet by placing stickers.</Instruction>
    <div style={{marginTop: "3rem"}}>Out of SticKeys?  You can <a href="https://dicekeys.com/store">order more</a>.</div>
  </div>
);

const CopyFaceInstructionView = observer( ({face, index, medium}: {face: Face, index: number, medium: BackupMedium}) => {
  const sheetIndex = FaceLetters.indexOf(face.letter) % 5;
  const firstLetterOnSheet = FaceLetters[sheetIndex * 5];
  const lastLetterOnSheet = FaceLetters[sheetIndex * 5 + 4];
  const indexMod5 = index % 5;
  const {letter, digit, orientationAsLowercaseLetterTrbl: oriented} = face;

  return (<div style={{minHeight: "7rem"}}><Instruction>
    { medium === BackupMedium.SticKey ? (<>
        Remove the {letter}{digit} sticker
        from the sheet with letters {firstLetterOnSheet} to {lastLetterOnSheet}.
      </>) : (<>
        Find the die with the letter {letter} on it.
      </>) 
    }<br/>
    {
      index === 0 ? (<>Pick a corner of the target sheet to be the top left and place it</>) :
      index === 1 ? (<>Place it just to the right of the first sticker you placed</>) :
      (indexMod5 == 4) ? (<>Place it in the last position of this row</>) :
      (indexMod5 == 0) ? (<>Place it in the leftmost position of the next (new) row</>) :
      (<>Place it in to the right of the previous sticker in the {
        indexMod5 === 1 ? "second" : indexMod5 === 2 ? "third" : "fourth"
      } row</>)
    }
    &nbsp;with {letter}{digit}&nbsp;
    { 
      oriented === "t" ? (<>upright (not turned)</>) :
      oriented === "b" ? (<>turned upside down</>) :
      oriented === "r" ? (<>turned the right (90 degrees clockwise of upright)</>) :
      oriented === "l" ? (<>turned the left (90 degrees counterclockwise of upright)</>) : ""
    }.
  </Instruction></div>);
});

const StepSelectBackupMedium = observer (({state}: {state: BackupViewState}) => (
  <div style={{
    display: "flex", alignSelf: "stretch", flexDirection: "column", flexGrow: 1,
    justifyContent: "center", alignContent: "center", alignItems: "center",
  }}>{
  [BackupMedium.SticKey, BackupMedium.DiceKey].map( medium => (
      <button key={medium}
        style={{...commonButtonStyle, marginBottom: "1vh"}}
        onClick={state.setBackupMedium(medium)}
      >
        <FaceCopyingView medium={medium} diceKey={state.diceKeyState.diceKey} showArrow={true} indexOfLastFacePlaced={12} 
          maxWidth="60vw" maxHeight="30vh"
        />
        <span style={{marginTop: "0.5rem"}}>Use {medium}</span>
      </button>
    ))}</div>));

const BackupStepSwitchView = observer ( ({state}: BackupViewProps) => {
  const {step, backupMedium, diceKeyState, validationStepViewState} = state;
  const {diceKey} = diceKeyState;
  const faceIndex = step - BackupStep.FirstFace;
  switch (step) {
    case BackupStep.SelectBackupMedium: return (<StepSelectBackupMedium state={state} />);
    case BackupStep.Introduction: return backupMedium === BackupMedium.DiceKey ? (<IntroToBackingUpToADiceKeyView/>):(<IntroToBackingUpToASticKeyView/>)
    case BackupStep.Validate: return ( <ValidateBackupView viewState={validationStepViewState} /> )
    default: return (backupMedium == null || step < BackupStep.FirstFace || step > BackupStep.LastFace) ? (<></>) : (
      <>
        <FaceCopyingView medium={backupMedium} diceKey={diceKey} indexOfLastFacePlaced={faceIndex}
           maxWidth="80vw" maxHeight="60vh"
        />
        { diceKey == null ? null : (
          <CopyFaceInstructionView medium={backupMedium} face={diceKey.faces[faceIndex]} index={faceIndex} />
        )}
      </>
    );
  }
});

export const BackupContentView = observer ( (props: BackupViewProps) => (
  <div className={layoutCSS.PaddedContentBox}>
    <BackupStepSwitchView {...props} />
  </div>
));


interface BackupViewProps {
  state: BackupViewState;
  prevStepBeforeStart?: () => any;
  nextStepAfterEnd?: () => any;
}

export const BackupStepFooterView = observer ( ({
    state,
    prevStepBeforeStart,
    nextStepAfterEnd,
  }: BackupViewProps) => (
  <StepFooterView 
    aboveFooter = {
      (state.step === BackupStep.Validate && !state.userChoseToSkipValidationStep && !state.validationStepState.backupScannedSuccessfully) ? (
        <button className={stepCSS.StepButton}
          onClick={state.setUserChoseToSkipValidationStep} >Let me skip this step
        </button>
      ): undefined}
    pprev={state.setStepTo(state.step <= BackupStep.FirstFace ? undefined : BackupStep.FirstFace)}
    prev={
      // If at the start, allow a parent to set a previous step (for embedding backup into assembly instructions)
      state.step === BackupStep.START_INCLUSIVE ? prevStepBeforeStart :
      state.setStepTo(state.stepMinus1)
    }
    nextIsDone={state.step === (BackupStep.END_EXCLUSIVE - 1)}
    next={
      // If at the end, allow a parent to set a next step (for embedding backup into assembly instructions)
      state.step === (BackupStep.Validate) ? (
        (state.validationStepState.backupScannedSuccessfully || state.userChoseToSkipValidationStep) ? (nextStepAfterEnd ?? state.setStepTo(state.stepPlus1)) : undefined
      ) :
      // Don't show next when selecting a backup medium
      state.step === BackupStep.SelectBackupMedium ? undefined :
      state.setStepTo(state.stepPlus1)}
    nnext={state.step >= BackupStep.FirstFace && state.step < BackupStep.LastFace - 1 ? state.setStepTo(BackupStep.Validate) : undefined}  
  />
));

export const BackupView = observer ( (props: BackupViewProps) => (
  <div className="BackupViewTop" style={{display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-around", alignContent: "stretch", alignItems: "center" }}>
    {/* Header, empty for spacing purposes only */}
    <div></div>
    <BackupContentView state={props.state} />
    <BackupStepFooterView {...props} />
  </div>));






class PreviewDiceKeyState {
  constructor(public diceKey: DiceKey) {
    makeAutoObservable(this);
  }
  setDiceKey = action( (diceKey?: DiceKey) => {
    if (diceKey != null)
      this.diceKey = diceKey;
  })
}
addPreviewWithMargins("Backup", () => ( 
  <BackupView state={new BackupViewState(new PreviewDiceKeyState(DiceKey.testExample), BackupStep.SelectBackupMedium)} />
));
addPreviewWithMargins("Backup1Error", () => {
  const diceKeyState = new PreviewDiceKeyState(DiceKey.testExample);
  const state = new BackupViewState(diceKeyState);
  state.setBackupMedium(BackupMedium.DiceKey);
  const diceKeyWithErrors = new DiceKey(diceKeyState.diceKey.rotate(1).faces.map( (face, index) => {
      switch(index) {
        case 3: return {...face, letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 5) % FaceLetters.length]};
        default: return face;
      }
    }
  ));
  state.setStep(BackupStep.Validate);
  state.diceKeyScannedFromBackup.setDiceKey(diceKeyWithErrors)
  return ( 
  <BackupView state={state} />
)});

addPreviewWithMargins("BackupShowErrors", () => {
  const diceKeyState = new PreviewDiceKeyState(DiceKey.testExample);
  const state = new BackupViewState(diceKeyState);
  state.setBackupMedium(BackupMedium.DiceKey);
  const diceKeyWithErrors = new DiceKey(diceKeyState.diceKey.rotate(1).faces.map( (face, index) => {
      switch(index) {
        case 3: return {...face, letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 5) % FaceLetters.length]};
        case 8: return {...face, digit: FaceDigits[(FaceDigits.indexOf(face.digit) + 3) % FaceDigits.length]};
        case 13: return {...face, letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 3) % FaceLetters.length]};
        case 20: return {...face, orientationAsLowercaseLetterTrbl: FaceOrientationLettersTrbl[(FaceOrientationLettersTrbl.indexOf(face.orientationAsLowercaseLetterTrbl) + 1) % FaceOrientationLettersTrbl.length]};
        case 22: return {
          letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 12) % FaceLetters.length],
          digit: FaceDigits[(FaceDigits.indexOf(face.digit) + 1) % FaceDigits.length],
          orientationAsLowercaseLetterTrbl: FaceOrientationLettersTrbl[(FaceOrientationLettersTrbl.indexOf(face.orientationAsLowercaseLetterTrbl) + 3) % FaceOrientationLettersTrbl.length]};
        default: return face;
      }
    }
  ));
  state.setStep(BackupStep.Validate);
  state.diceKeyScannedFromBackup.setDiceKey(diceKeyWithErrors)
  return ( 
  <BackupView state={state} />
)});
