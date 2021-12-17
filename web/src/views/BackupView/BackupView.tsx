import { DiceKey, DiceKeyFaces, DiceKeyWithoutKeyId, Face } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { StepFooterView } from "../Navigation/StepFooterView";
import { FaceCopyingView } from "../SVG/FaceCopyingView";
import { FaceDigits, FaceLetters, FaceOrientationLettersTrbl } from "@dicekeys/read-dicekey-js";
import { CenterRow, Instruction, Spacer } from "../basics";
import { addPreviewWithMargins } from "../basics/Previews";
import { BackupMedium } from "./BackupMedium";
import { ValidateBackupView } from "./ValidateBackupView";
import { StickerSheetView } from "../SVG/StickerSheetView";
import { StickerTargetSheetView } from "../SVG/StickerTargetSheetView";
import { DiceKeyView } from "../SVG/DiceKeyView";
import {BackupStep, BackupViewState} from "./BackupViewState";
import { StepButton } from "../../css/Button";
import styled from "styled-components";
import { SelectedDiceKeyContentRegionInsideSideMargins} from "../../views/WithSelectedDiceKey/SelectedDiceKeyLayout";

export const ComparisonBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items:center;
  margin-left: 1rem;
  margin-right: 1rem;
  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;  
  }
`;

const FeatureCardButton = styled.button`
  align-self: center;
  display: flex;
  cursor: grab;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
  align-content: center;
  padding-top: 1.5vh;
  padding-bottom: 1.5vh;
  margin-top: 1.5vh;
  margin-bottom: 1.5vh;
  border-radius: min(1vh,1vw);
  padding-left: 1vw;
  padding-right: 1vw;
  border: none;
  &:hover {
    background: rgba(128,128,128,0.2);
  }
  &:not(:first-of-type) {
    margin-top: 1vh;
  }
`;

const LabelBelowButtonImage = styled.div`
  margin-top: 0.5rem;
`;

const NoteDiv = styled.div`
` 

const IntroToBackingUpToADiceKeyView = () => (
  <>
    <Spacer/>
    <Instruction>Open your DiceKey kit and take out the box bottom and the 25 dice.</Instruction>
    <Spacer/>
    <CenterRow>
      <ComparisonBox>
        <DiceKeyView size={`min(35vh,45vw)`} />
      </ComparisonBox>
    </CenterRow>
    <Spacer/>
    <Instruction>Next, you will replicate the first DiceKey by copying the arrangement of dice.</Instruction>
    <Spacer/>
    <NoteDiv>Need another DiceKey?  You can <a target="_blank" href="https://dicekeys.com/store">order more</a>.</NoteDiv>
  </>
)
const IntroToBackingUpToASticKeyView = () => (
  <>
    <Spacer />
    <Instruction>Unwrap your SticKeys kit.</Instruction>
    <Spacer />
    <CenterRow>
      <ComparisonBox>
        <StickerSheetView maxHeight="45vh" maxWidth="45vw" />
        5 sticker sheets
      </ComparisonBox>
      <ComparisonBox>
        <StickerTargetSheetView maxHeight="45vh" maxWidth="45vw" />
        1 target sheet
      </ComparisonBox>
    </CenterRow>
    <Spacer />
    <Instruction>Next, you will create a copy of your DiceKey on the target sheet by placing stickers.</Instruction>
    <Spacer />
    <NoteDiv>Out of SticKeys?  You can <a  target="_blank" href="https://dicekeys.com/store">order more</a>.</NoteDiv>
  </>
);

const CopyFaceInstructionView = observer( ({face, index, medium}: {face: Face, index: number, medium: BackupMedium}) => {
  const sheetIndex = FaceLetters.indexOf(face.letter) % 5;
  const firstLetterOnSheet = FaceLetters[sheetIndex * 5];
  const lastLetterOnSheet = FaceLetters[sheetIndex * 5 + 4];
  const indexMod5 = index % 5;
  const {letter, digit, orientationAsLowercaseLetterTrbl: oriented} = face;

  return (<Instruction minLines={4}>
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
  </Instruction>);
});

const StepSelectBackupMedium = observer (({state, prevStepBeforeStart}: BackupViewProps) => (
  <>
    <Instruction>Do you want to back up your key to a DiceKey kit or a SticKey kit?</Instruction>{
      ([[BackupMedium.SticKey, "Use a SticKey kit (stickers on a paper sheet)"],
        [BackupMedium.DiceKey, "Use a DiceKey kit (25 dice in a plastic box)"]
      ] as [BackupMedium, string][]).map( ([medium, label]) => (
        <FeatureCardButton key={medium}
          onClick={state.setBackupMedium(medium)}
        >
          <FaceCopyingView medium={medium} diceKey={state.diceKeyState.diceKey} showArrow={true} indexOfLastFacePlaced={12} 
            maxWidth="60vw"
            maxHeight={prevStepBeforeStart != null ? 
              // Leave space for a footer with a previous step button
              "18vh" :
              // No need for footer with space for previous step button.
              "22vh"
            }
          />
          <LabelBelowButtonImage>{label}</LabelBelowButtonImage>
        </FeatureCardButton>
      ))}
    </>
  ));

export const BackupStepSwitchView = observer ( ({state}: BackupViewProps) => {
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
           maxWidth="80vw" maxHeight="45vh"
        />
        { diceKey == null ? null : (
          <CopyFaceInstructionView medium={backupMedium} face={diceKey.faces[faceIndex]!} index={faceIndex} />
        )}
      </>
    );
  }
});

const BackupContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  justify-content: space-around;
  align-items: flex-start;
  flex-grow: 1;
  /* margin-top: 2vh; */
`

export const BackupContentView = observer ( (props: BackupViewProps) => (
  <BackupContentContainer>
    <BackupStepSwitchView {...props} />
  </BackupContentContainer>
));


interface BackupViewProps {
  state: BackupViewState;
  prevStepBeforeStart?: () => any;
  nextStepAfterEnd?: () => any;
}

const RowAboveFooter = styled.div`
  margin-bottom: 0.5rem;
`

export const BackupStepFooterView = observer ( ({
    state,
    prevStepBeforeStart,
    nextStepAfterEnd
  }: BackupViewProps) => {
  if (state.step === BackupStep.SelectBackupMedium && !prevStepBeforeStart) return (<div>&nbsp;</div> );
  return (
  <StepFooterView 
    aboveFooter = {
      (state.step === BackupStep.Validate) ? (
        <RowAboveFooter>
          <StepButton
            invisible={state.userChoseToSkipValidationStep || state.validationStepViewState.backupScannedSuccessfully}
            onClick={state.setUserChoseToSkipValidationStep}
            style={{marginBottom: "0.5rem"}}  
          >Let me skip this step
          </StepButton>
        </RowAboveFooter>
      ): undefined}
    pprev={state.step <= BackupStep.FirstFace ? undefined : state.setStepTo(BackupStep.FirstFace)}
    prev={
      // If at the start, allow a parent to set a previous step (for embedding backup into assembly instructions)
      state.step === BackupStep.START_INCLUSIVE ? prevStepBeforeStart :
      state.setStepTo(state.stepMinus1)
    }
    nextIsDone={state.step === (BackupStep.END_EXCLUSIVE - 1) && nextStepAfterEnd == null}
    next={
      // If at the end, allow a parent to set a next step (for embedding backup into assembly instructions)
      state.step === (BackupStep.Validate) ? (
        (state.validationStepViewState.backupScannedSuccessfully || state.userChoseToSkipValidationStep) ? (nextStepAfterEnd ?? state.setStepTo(state.stepPlus1)) : undefined
      ) :
      // Don't show next when selecting a backup medium
      state.step === BackupStep.SelectBackupMedium ?
        undefined :
        state.setStepTo(state.stepPlus1)}
    nnext={state.step >= BackupStep.FirstFace && state.step < BackupStep.LastFace - 1 ? state.setStepTo(BackupStep.Validate) : undefined}  
  />
      )});

const BackViewContentContainer = styled(SelectedDiceKeyContentRegionInsideSideMargins)`
  // Align to top so content doesn't fly around.
  justify-content: flex-start;
`

export const BackupView = observer ( (props: BackupViewProps) => (
  <BackViewContentContainer>
    <BackupContentView state={props.state} />
    <BackupStepFooterView {...props} />
  </BackViewContentContainer>));




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
  <BackupView state={new BackupViewState(new PreviewDiceKeyState(DiceKeyWithoutKeyId.testExample), BackupStep.SelectBackupMedium)} />
));

addPreviewWithMargins("BackupNoErrors", () => {
  const diceKeyState = new PreviewDiceKeyState(DiceKeyWithoutKeyId.testExample);
  const state = new BackupViewState(diceKeyState);
  state.setBackupMedium(BackupMedium.DiceKey);
  state.setStep(BackupStep.Validate);
  state.diceKeyScannedFromBackup.setDiceKey(DiceKeyWithoutKeyId.testExample)
  return (<BackupView state={state} />
)});

addPreviewWithMargins("Backup1Error", () => {
  const diceKeyState = new PreviewDiceKeyState(DiceKeyWithoutKeyId.testExample);
  const state = new BackupViewState(diceKeyState);
  state.setBackupMedium(BackupMedium.DiceKey);
  const diceKeyWithErrors = new DiceKeyWithoutKeyId(DiceKeyFaces(diceKeyState.diceKey.rotate(1).faces.map( (face, index) => {
      switch(index) {
        case 3: return {...face, letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 5) % FaceLetters.length]!};
        default: return face;
      }
    }
  )));
  state.setStep(BackupStep.Validate);
  state.diceKeyScannedFromBackup.setDiceKey(diceKeyWithErrors)
  return ( 
  <BackupView state={state} />
)});

addPreviewWithMargins("BackupShowErrors", () => {
  const diceKeyState = new PreviewDiceKeyState(DiceKeyWithoutKeyId.testExample);
  const state = new BackupViewState(diceKeyState);
  state.setBackupMedium(BackupMedium.DiceKey);
  const diceKeyWithErrors = new DiceKeyWithoutKeyId(DiceKeyFaces(diceKeyState.diceKey.rotate(1).faces.map( (face, index) => {
      switch(index) {
        case 3: return {...face, letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 5) % FaceLetters.length]!};
        case 8: return {...face, digit: FaceDigits[(FaceDigits.indexOf(face.digit) + 3) % FaceDigits.length]!};
        case 13: return {...face, letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 3) % FaceLetters.length]!};
        case 20: return {...face, orientationAsLowercaseLetterTrbl: FaceOrientationLettersTrbl[(FaceOrientationLettersTrbl.indexOf(face.orientationAsLowercaseLetterTrbl) + 1) % FaceOrientationLettersTrbl.length]!};
        case 22: return {
          letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 12) % FaceLetters.length]!,
          digit: FaceDigits[(FaceDigits.indexOf(face.digit) + 1) % FaceDigits.length]!,
          orientationAsLowercaseLetterTrbl: FaceOrientationLettersTrbl[(FaceOrientationLettersTrbl.indexOf(face.orientationAsLowercaseLetterTrbl) + 3) % FaceOrientationLettersTrbl.length]!};
        default: return face;
      }
    }
  )));
  state.setStep(BackupStep.Validate);
  state.diceKeyScannedFromBackup.setDiceKey(diceKeyWithErrors)
  return ( 
  <BackupView state={state} />
)});
