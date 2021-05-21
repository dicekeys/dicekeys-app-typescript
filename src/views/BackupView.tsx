import { DiceKey } from "../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { StepFooterView } from "./Navigation/StepFooterView";
import { DiceKeyCopyingView, FaceCopyingView, SticKeyCopyingView } from "./SVG/FaceCopyingView";

enum Step {
  SelectBackupMedium = 1,
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
  backupScanned?: DiceKey;
  step: Step;
  setStep = action ( (step: Step) => this.step = step );
  get stepPlus1() { return validStepOrUndefined(this.step+1) }
  get stepMinus1() { return validStepOrUndefined(this.step-1) }
  userChoseToAllowSkipScanningStep: boolean = false;
  userChoseToAllowSkippingBackupStep: boolean = false;

  constructor(step: Step = Step.START_INCLUSIVE) {
    this.step = step;
    makeAutoObservable(this);
  }
}

const commonBottomStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", justifyContent: "normal", alignItems: "stretch", height: "25vh", padding:"1vh", border: "none"
}

const StepSelectBackupMedium = observer (({diceKey, state}: BackupViewProps) => {
  return (
    <div style={{display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignContent: "stretch"}}>
      <button
        style={{...commonBottomStyle, marginBottom: "1vh"}}
        onClick={state.setBackupMedium(BackupMedium.SticKey)}
      >
        <SticKeyCopyingView diceKey={diceKey} showArrow={true} indexOfLastFacePlaced={12} />
        <span style={{marginTop: "0.5rem"}}>Use SticKey</span>
      </button>
      <button
        style={{...commonBottomStyle, marginTop: "1vh"}}
        onClick={state.setBackupMedium(BackupMedium.SticKey)}
      >
        <DiceKeyCopyingView diceKey={diceKey} showArrow={true} indexOfLastFacePlaced={12}  matchSticKeyAspectRatio={true} />
        <span style={{marginTop: "0.5rem"}}>Use DiceKey</span>
      </button>
   </div>
)});

const BackupStepSwitchView = observer ( (props: BackupViewProps) => {
  const {step, backupMedium} = props.state;
  switch (step) {
    case Step.SelectBackupMedium: return (<StepSelectBackupMedium {...props} />);
    case Step.Validate: return (<>FIXME</>)
    default: return (backupMedium == null || step < Step.FirstFace || step > Step.LastFace) ? (<></>) : (
      <>
        <FaceCopyingView medium={backupMedium} diceKey={props.diceKey} indexOfLastFacePlaced={step - Step.FirstFace} />
      </>
    );
  }

});

interface BackupViewProps {
  state: BackupState;
  diceKey: DiceKey;
//  onComplete: () => any;
}
export const BackupView = observer ( (props: BackupViewProps) => {
  const {state} = props; //, diceKey //, onComplete } = props;
    // <div className={Layout.RowStretched}>
    //   <div className={Layout.ColumnStretched}>
    //     <SimpleTopNavBar title={`Backup ${diceKey.nickname}`} goBack={ () => onComplete() } />
    //     <div className={Layout.PaddedStretchedColumn}>
    return (<>
      <BackupStepSwitchView {...props} />
      { state.backupMedium == null ? (<></>) : (
        <StepFooterView setStep={state.setStep} pprev={undefined} prev={state.stepMinus1} next={state.stepPlus1} />
      )}
    </>)
      //   </div>
      // </div>
    // </div>
  });


export const Preview_BackupView = () => {
  return (
    <BackupView diceKey={DiceKey.fromRandom()} state={new BackupState(Step.SelectBackupMedium)}  />
  );
};
