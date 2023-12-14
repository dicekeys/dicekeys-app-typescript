/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import { StepButton } from "../../css/Button";
import { DiceKey, DiceKeyFaces, DiceKeyWithKeyId, DiceKeyWithoutKeyId, FaceDigits, FaceLetters, FaceOrientationLettersTrbl, OrientedFace } from "../../dicekeys/DiceKey";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { StoreLink } from "../basics/ExternalLink";
import { StepFooterView } from "../Navigation/StepFooterView";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { FaceCopyingView } from "../SVG/FaceCopyingView";
import { StickerSheetView } from "../SVG/StickerSheetView";
import { StickerTargetSheetView } from "../SVG/StickerTargetSheetView";
import { CenterRow, Instruction, Spacer } from "../basics";
import { addPreviewWithMargins } from "../basics/Previews";
import { HandGeneratedBackupMedium, HandGeneratedBackupMediumDice, HandGeneratedBackupMediumStickers } from "../../dicekeys/PhysicalMedium";
import { BackupDiceKeyState, BackupToPrinterViewState, CopyToPhysicalMediumStep } from "./BackupDiceKeyState";
import { CopyToPhysicalMediumWizardState } from "./CopyToPhysicalMediumWizardState";
import { ValidateBackupView } from "./ValidateBackupView";
import { ValidateBackupViewState } from "./ValidateBackupViewState";
import { SelectBackupMediumView } from "./SelectBackupMedium";
import { SimpleSecretSharingView } from "../SimpleSecretSharing/SimpleSecretSharingView";
import { SimpleSecretSharingState } from "../SimpleSecretSharing/SimpleSecretSharingState";
import { PrintDiceKeyView } from "../SimpleSecretSharing/PrintDiceKeyView";
import { BackupStatus, BackupStatusCompletedAndValidated, BackupStatusCompletedWithoutValidation } from "./BackupStatus";

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

export const LabelBelowButtonImage = styled.div`
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
        <DiceKeyView $size={`min(35vh,45vw)`} obscureAllButCenterDie={false} />
      </ComparisonBox>
    </CenterRow>
    <Spacer/>
    <Instruction>Next, you will replicate the first DiceKey by copying the arrangement of dice.</Instruction>
    <Spacer/>
    <NoteDiv>Need another DiceKey?  You can <StoreLink>order more</StoreLink>.</NoteDiv>
  </>
)
const IntroToBackingUpToASticKeyView = () => (
  <>
    <Spacer />
    <Instruction>Unwrap your SticKeys kit.</Instruction>
    <Spacer />
    <CenterRow>
      <ComparisonBox>
        <StickerSheetView style={{width: `30vw`}} />
        5 sticker sheets
      </ComparisonBox>
      <ComparisonBox>
        <StickerTargetSheetView style={{width: `30vw`}} />
        1 target sheet
      </ComparisonBox>
    </CenterRow>
    <Spacer />
    <Instruction>Next, you will create a copy of your DiceKey on the target sheet by placing stickers.</Instruction>
    <Spacer />
    <NoteDiv>Out of SticKeys?  You can <StoreLink>order more</StoreLink>.</NoteDiv>
  </>
);

const CopyFaceInstructionView = observer( ({face, index, medium}: {face: OrientedFace, index: number, medium: HandGeneratedBackupMedium}) => {
  const sheetIndex = FaceLetters.indexOf(face.letter) % 5;
  const firstLetterOnSheet = FaceLetters[sheetIndex * 5];
  const lastLetterOnSheet = FaceLetters[sheetIndex * 5 + 4];
  const indexMod5 = index % 5;
  const {letter, digit, orientationAsLowercaseLetterTrbl: oriented} = face;

  return (<Instruction $minLines={4}>
    { medium === HandGeneratedBackupMediumStickers ? (<>
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
      }&nbsp;row</>)
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

export const HandBackupStepSwitchView = observer ( ({validationStepViewState, step, medium, diceKey}: {
  validationStepViewState: ValidateBackupViewState,
  step: CopyToPhysicalMediumStep,
  medium: HandGeneratedBackupMedium,
  diceKey: DiceKey
}) => {
  const faceIndex = step - CopyToPhysicalMediumStep.FirstFace;
  switch (step) {
    case CopyToPhysicalMediumStep.Introduction: return medium === HandGeneratedBackupMediumDice ? (<IntroToBackingUpToADiceKeyView/>):(<IntroToBackingUpToASticKeyView/>)
    case CopyToPhysicalMediumStep.Validate: return ( <ValidateBackupView viewState={validationStepViewState} /> )
    default: return (medium == null || step < CopyToPhysicalMediumStep.FirstFace || step > CopyToPhysicalMediumStep.LastFace) ? (<></>) : (
      <>
        <FaceCopyingView obscureAllButCenterDie={false} medium={medium} diceKey={diceKey} indexOfLastFacePlaced={faceIndex}
           style={{width: '80vw', marginLeft: `auto`, marginRight: `auto`}}
        />
        { diceKey == null ? null : (
          <CopyFaceInstructionView medium={medium} face={diceKey.faces[faceIndex]!} index={faceIndex} />
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

export const CopyToPhysicalMediumContentView = observer ( (props: React.ComponentProps<typeof HandBackupStepSwitchView>) => (
  <BackupContentContainer>
    <HandBackupStepSwitchView {...props} />
  </BackupContentContainer>
));


export interface CopyToPhysicalMediumWizardProps {
  state: CopyToPhysicalMediumWizardState;
  onBackFromStart?: () => void;
  onComplete?: (status: BackupStatus) => void;
}

export interface BackupViewProps {
  state: BackupDiceKeyState;
  onComplete: (status: BackupStatus) => void;
  onBackFromStart?: () => void;
}

const RowAboveFooter = styled.div`
  margin-bottom: 0.5rem;
`


export const CopyToPhysicalMediumWizardFooterView = observer ( ({
  state,
  onBackFromStart: prevStepBeforeStart,
  onComplete: nextStepAfterEnd
}: CopyToPhysicalMediumWizardProps) => (
  <StepFooterView 
    pprev={state.step <= CopyToPhysicalMediumStep.FirstFace ? undefined : state.setStepTo(CopyToPhysicalMediumStep.FirstFace)}
    prev={
      // If at the start, allow a parent to set a previous step (for embedding backup into assembly instructions)
      state.step === CopyToPhysicalMediumStep.START_INCLUSIVE ? prevStepBeforeStart :
      state.setStepTo(state.stepMinus1)
    }
    nextIsDone={state.step === (CopyToPhysicalMediumStep.END_EXCLUSIVE - 1) && nextStepAfterEnd == null}
    next={
      // If at the end, allow a parent to set a next step (for embedding backup into assembly instructions)
      (state.step === CopyToPhysicalMediumStep.Validate && !state.userChoseToSkipValidationStep && !state.backupValidated) ? undefined :
      (state.step === CopyToPhysicalMediumStep.END_INCLUSIVE) ? (
        (nextStepAfterEnd != null ?
          () => nextStepAfterEnd(state.validationStepViewState.backupScannedSuccessfully ? BackupStatusCompletedAndValidated : BackupStatusCompletedWithoutValidation) :
          state.setStepTo(state.stepPlus1)
        )
      ) :
      state.setStepTo(state.stepPlus1)
    }
    nnext={state.step >= CopyToPhysicalMediumStep.FirstFace && state.step < CopyToPhysicalMediumStep.LastFace - 1 ? state.setStepTo(CopyToPhysicalMediumStep.Validate) : undefined}  
  >{(state.step !== CopyToPhysicalMediumStep.Validate) ? null : (
      <RowAboveFooter>
        <StepButton
          $invisible={state.userChoseToSkipValidationStep || state.validationStepViewState.backupScannedSuccessfully}
          onClick={state.setUserChoseToSkipValidationStep}
          style={{marginBottom: "0.5rem"}}  
        >Let me skip this step
        </StepButton>
      </RowAboveFooter>
    )
  }</StepFooterView>
));

export const CopyToPhysicalMediumWizardView  = observer ( (props: CopyToPhysicalMediumWizardProps) => {
  const {state} = props;
  const diceKey = state.getDiceKey();
  if (diceKey == null) return null;
  const {validationStepViewState, step, medium} = state;
  return (
    <>
      <BackupContentContainer>
        <HandBackupStepSwitchView {...{diceKey, validationStepViewState, step, medium}} />
      </BackupContentContainer>
      <CopyToPhysicalMediumWizardFooterView {...props} />
    </>)
});

export const BackupToPrinterView = observer ( ({state, onComplete, children,
  title=`DiceKey with ${state.getDiceKey()?.centerLetterAndDigit} in center`,
}: React.PropsWithChildren<{
  state: BackupToPrinterViewState;
	title?: string | JSX.Element;
	onComplete: (status: BackupStatus) => void;
}>) => {
  const diceKey = state.getDiceKey();
  if (diceKey == null) return;
   return (
    <PrintDiceKeyView {...{onComplete, title, diceKey}} >{children}</PrintDiceKeyView>
  )
});

export const BackupDiceKeyView = observer ( ({state, onComplete}: BackupViewProps) => {
  const {subView, getDiceKey} = state;
  const {subViewState} = subView;
  const diceKey = getDiceKey();
  const chooseMediumAgain = () =>  state.subView.navigateToReplaceState(undefined);
  if (diceKey == null) return null;
  if (subViewState == null) {
    return (<SelectBackupMediumView diceKey={diceKey} onSelected={state.chooseBackupType} />)
  } else if (subViewState instanceof CopyToPhysicalMediumWizardState) {
    return (<CopyToPhysicalMediumWizardView state={subViewState} onBackFromStart={chooseMediumAgain} {...{onComplete}} />);
  } else if (subViewState instanceof SimpleSecretSharingState) {
    return (<SimpleSecretSharingView simplesSecretSharingState={subViewState} onBackFromStart={chooseMediumAgain} {...{onComplete}} />);
  } else if (subViewState instanceof BackupToPrinterViewState) {
    return (<BackupToPrinterView state={subViewState} onComplete={onComplete} />);
  }
  return null;
});

addPreviewWithMargins("Copy to dice", () => ( 
  <CopyToPhysicalMediumWizardView state={new CopyToPhysicalMediumWizardState(NavigationPathState.root, HandGeneratedBackupMediumDice, {getDiceKey: () => DiceKeyWithKeyId.testExample, step: CopyToPhysicalMediumStep.Introduction})} />
));

addPreviewWithMargins("Copy to stickers", () => ( 
  <CopyToPhysicalMediumWizardView state={new CopyToPhysicalMediumWizardState(NavigationPathState.root, HandGeneratedBackupMediumStickers, {getDiceKey: () => DiceKeyWithKeyId.testExample, step: CopyToPhysicalMediumStep.Introduction})} />
));

addPreviewWithMargins("BackupNoErrors", () => {
  const state = new CopyToPhysicalMediumWizardState(NavigationPathState.root, HandGeneratedBackupMediumDice, {getDiceKey: () => DiceKeyWithKeyId.testExample});
  state.setStep(CopyToPhysicalMediumStep.Validate);
  state.validationStepViewState.setDiceKeyScannedForValidation(DiceKeyWithKeyId.testExample)
  return (<CopyToPhysicalMediumWizardView state={state} />
)});

addPreviewWithMargins("Backup1Error", () => {
  const diceKey = DiceKeyWithKeyId.testExample;
  const state = new CopyToPhysicalMediumWizardState(NavigationPathState.root, HandGeneratedBackupMediumDice, {getDiceKey: () => diceKey, step: CopyToPhysicalMediumStep.Validate});
  const diceKeyWithErrors = new DiceKeyWithoutKeyId(DiceKeyFaces(diceKey.rotate(1).faces.map( (face, index) => {
      switch(index) {
        case 3: return {...face, letter: FaceLetters[(FaceLetters.indexOf(face.letter) + 5) % FaceLetters.length]!};
        default: return face;
      }
    }
  )));
  diceKeyWithErrors.withKeyId.then( diceKey => state.validationStepViewState.setDiceKeyScannedForValidation(diceKey) );
  return ( 
  <CopyToPhysicalMediumWizardView state={state} />
)});

addPreviewWithMargins("BackupShowErrors", () => {
  const diceKey = DiceKeyWithKeyId.testExample;
  const state = new CopyToPhysicalMediumWizardState(NavigationPathState.root, HandGeneratedBackupMediumDice, {getDiceKey: () => diceKey, step: CopyToPhysicalMediumStep.Validate} );
  const diceKeyWithErrors = new DiceKeyWithoutKeyId(DiceKeyFaces(diceKey.rotate(1).faces.map( (face, index) => {
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
  diceKeyWithErrors.withKeyId.then( diceKey => state.validationStepViewState.setDiceKeyScannedForValidation(diceKey) );
  return ( 
  <CopyToPhysicalMediumWizardView state={state} />
)});
