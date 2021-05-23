import { DiceKey, Face } from "../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { StepFooterView } from "./Navigation/StepFooterView";
import { DiceKeyCopyingView, FaceCopyingView, SticKeyCopyingView } from "./SVG/FaceCopyingView";
import { FaceLetters } from "@dicekeys/read-dicekey-js";
import { Instruction } from "./basics";
import { ScanDiceKeyView } from "./LoadingDiceKeys/ScanDiceKeyView";

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

  get errors() { return this.diceKeyScannedFromBackup ? this.diceKeyToBackUp.compareTo(this.diceKeyScannedFromBackup) : undefined }
  get backupScannedSuccessfully() { return this.diceKeyScannedFromBackup && this.errors?.length === 0 }

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

  if (state.scanning) {
    return (<>
      <ScanDiceKeyView onDiceKeyRead={ state.setBackupScanned } />
      <button onClick={state.stopScanning} >Stop scanning</button>
    </>)
  } else if (state.backupScannedSuccessfully) {
    return (<>
      Success!
    </>)
  } else if (state.errors) {    
    return (<>
      {state.errors.length} faces with errors.
    </>)
  } else {
    return (<>
      <button onClick={state.startScanning} >Scan to verify</button>      
    </>);
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


export const Preview_BackupView = () => {
  return (
    <BackupView state={new BackupState(DiceKey.fromRandom(), Step.SelectBackupMedium)}  />
  );
};
