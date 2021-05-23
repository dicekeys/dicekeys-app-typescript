import { DiceKey, Face, PartialDiceKey } from "../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { StepFooterView } from "./Navigation/StepFooterView";
import { DiceKeyCopyingView, FaceCopyingView, SticKeyCopyingView } from "./SVG/FaceCopyingView";
import { FaceDigits, FaceLetters, FaceOrientationLettersTrbl } from "@dicekeys/read-dicekey-js";
import { Instruction } from "./basics";
import { ScanDiceKeyView } from "./LoadingDiceKeys/ScanDiceKeyView";
import { DiceKeyViewAutoSized } from "./SVG/DiceKeyView";
import { addPreview } from "./basics/Previews";

enum Step {
  SelectBackupMedium = 1,
//  Introduction, FIXME
  FirstFace,
  LastFace = FirstFace + 24,
  Validate,
  END_EXCLUSIVE,
  START_INCLUSIVE = 1,
}

const validStepOrUndefined = (step: number): Step | undefined =>
  (step >= Step.START_INCLUSIVE && step < Step.END_EXCLUSIVE) ? step : undefined;

enum BackupMedium {
  SticKey = "SticKey",
  DiceKey = "DiceKey",
}

// FIXME -- hide faces that have already been removed.
export class BackupState {
  backupMedium?: BackupMedium;
  setBackupMedium = (newMedium: BackupMedium) => action ( () => {
    this.backupMedium = newMedium;
    this.step = Step.SelectBackupMedium + 1;
  });
  diceKeyScannedFromBackup?: DiceKey;
  scanning: boolean = false;
  setScanning = (to: boolean) => action( () => this.scanning = to );
  startScanning = this.setScanning(true);
  stopScanning = this.setScanning(false); 
  setBackupScanned = action( (diceKey?: DiceKey) => {
    this.diceKeyScannedFromBackup = diceKey;
    this.scanning = false;
  })
  step: Step;
  setStep = action ( (step: Step) => {
    this.step = step;
    if (step === Step.Validate) {
      // If moving to the validation step, and if we had tried scanning a key to validate before,
      // clear what we scanned
      this.diceKeyScannedFromBackup = undefined;
    }
  });
  get stepPlus1() { return validStepOrUndefined(this.step+1) }
  get stepMinus1() { return validStepOrUndefined(this.step-1) }
  userChoseToAllowSkipScanningStep: boolean = false;
  userChoseToAllowSkippingBackupStep: boolean = false;

  get differencesBetweenOriginalAndBackup() { return this.diceKeyScannedFromBackup ? this.diceKeyToBackUp.compareTo(this.diceKeyScannedFromBackup) : undefined }
  get backupScannedSuccessfully() { return this.diceKeyScannedFromBackup && this.differencesBetweenOriginalAndBackup?.errors.length === 0 }
  get diceKeyScannedFromBackupAtRotationWithFewestErrors() {
    return this.differencesBetweenOriginalAndBackup?.otherDiceKeyRotated
  }

  constructor(public readonly diceKeyToBackUp: DiceKey, step: Step = Step.START_INCLUSIVE) {
    this.step = step;
    makeAutoObservable(this);
  }
}

const commonBottomStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", justifyContent: "normal", alignItems: "stretch", height: "25vh", padding:"1vh", border: "none"
}

const CopyFaceInstructionView = observer( ({face, index, medium}: {face: Face, index: number, medium: BackupMedium}) => {
  const sheetIndex = FaceLetters.indexOf(face.letter) % 5;
  const firstLetterOnSheet = FaceLetters[sheetIndex * 5];
  const lastLetterOnSheet = FaceLetters[sheetIndex * 5 + 4];
  const indexMod5 = index % 5;
  const {letter, digit, orientationAsLowercaseLetterTrbl: oriented} = face;

  return (<Instruction>
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

const StepSelectBackupMedium = observer (({state}: BackupViewProps) => {
  const {diceKeyToBackUp} = state;
  return (
    <div style={{display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignContent: "stretch"}}>
      <button
        style={{...commonBottomStyle, marginBottom: "1vh"}}
        onClick={state.setBackupMedium(BackupMedium.SticKey)}
      >
        <SticKeyCopyingView diceKey={diceKeyToBackUp} showArrow={true} indexOfLastFacePlaced={12} />
        <span style={{marginTop: "0.5rem"}}>Use SticKey</span>
      </button>
      <button
        style={{...commonBottomStyle, marginTop: "1vh"}}
        onClick={state.setBackupMedium(BackupMedium.DiceKey)}
      >
        <DiceKeyCopyingView diceKey={diceKeyToBackUp} showArrow={true} indexOfLastFacePlaced={12}  matchSticKeyAspectRatio={true} />
        <span style={{marginTop: "0.5rem"}}>Use DiceKey</span>
      </button>
   </div>
)});

const ValidateBackupView  = observer ( (props: BackupViewProps) => {
  const {state} = props;
  const {
    backupScannedSuccessfully,
    diceKeyToBackUp,
    diceKeyScannedFromBackupAtRotationWithFewestErrors,
    differencesBetweenOriginalAndBackup,
  } = state;
  if (state.scanning) {
    return (<>
      <ScanDiceKeyView onDiceKeyRead={ state.setBackupScanned } />
      <button onClick={state.stopScanning} >Stop scanning</button>
    </>)
  } else {
    return (<>
      <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
        <DiceKeyViewAutoSized faces={diceKeyToBackUp.faces}
          aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
          />
        <DiceKeyViewAutoSized faces={diceKeyScannedFromBackupAtRotationWithFewestErrors?.faces ?? [] as unknown as PartialDiceKey }
          // style={{width: "calc(min(40vh, 30vw)", height: "calc(min(40vh, 30vw)"}}
          aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
        />
      </div>
      { backupScannedSuccessfully ? (<>Success!</>) :
        (differencesBetweenOriginalAndBackup?.errors ?? 0) > 5 ?
          (<>The backup doesn't look anything like the original.</>) :
          (<>{ differencesBetweenOriginalAndBackup?.errors[0].index }</>)
      }
      
      <button onClick={state.startScanning} >{
        state.diceKeyScannedFromBackup == null ? (<>Scan to verify</>) : (<>Re-scan</>)
      }</button>  
    </>)
  }
});

const BackupStepSwitchView = observer ( (props: BackupViewProps) => {
  const {step, backupMedium, diceKeyToBackUp} = props.state;
  const faceIndex = step - Step.FirstFace;
  switch (step) {
    case Step.SelectBackupMedium: return (<StepSelectBackupMedium {...props} />);
    case Step.Validate: return (<ValidateBackupView {...props} />)
    default: return (backupMedium == null || step < Step.FirstFace || step > Step.LastFace) ? (<></>) : (
      <>
        <FaceCopyingView medium={backupMedium} diceKey={diceKeyToBackUp} indexOfLastFacePlaced={faceIndex} />
        <CopyFaceInstructionView medium={backupMedium} face={diceKeyToBackUp.faces[faceIndex]} index={faceIndex} />
      </>
    );
  }
});

interface BackupViewProps {
  state: BackupState;
//  onComplete: () => any;
}
export const BackupView = observer ( (props: BackupViewProps) => {
  const {state} = props; //, diceKey //, onComplete } = props;
  const {step} = state;
    // <div className={Layout.RowStretched}>
    //   <div className={Layout.ColumnStretched}>
    //     <SimpleTopNavBar title={`Backup ${diceKey.nickname}`} goBack={ () => onComplete() } />
    //     <div className={Layout.PaddedStretchedColumn}>
    return (<>
      <BackupStepSwitchView {...props} />
      { state.backupMedium == null ? (<></>) : (
        <StepFooterView 
          setStep={state.setStep}
          pprev={step > Step.FirstFace + 1 ? Step.FirstFace : undefined}
          prev={state.stepMinus1}
          next={state.stepPlus1}
          nnext={step >= Step.FirstFace && step < Step.LastFace - 1 ? Step.Validate : undefined}  
        />
      )}
    </>)
      //   </div>
      // </div>
    // </div>
  });

addPreview("Backup", () => ( 
  <BackupView state={new BackupState(DiceKey.fromRandom(), Step.SelectBackupMedium)} />
));
addPreview("BackupShowErrors", () => {
  const referenceDiceKey = DiceKey.testExample;
  const state = new BackupState(referenceDiceKey, Step.Validate);
  state.setBackupMedium(BackupMedium.DiceKey);
  const diceKeyWithErrors = new DiceKey(referenceDiceKey.rotate(1).faces.map( (face, index) => {
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
  state.setBackupScanned(diceKeyWithErrors)
  return ( 
  <BackupView state={state} />
)});
