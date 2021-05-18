import { DiceKey } from "../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { SimpleTopNavBar } from "./Navigation/SimpleTopNavBar";
import { StepFooterView } from "./Navigation/StepFooterView";
import Layout from "../css/Layout.module.css";

// import IllustrationOfShakingBag from /*url:*/"../images/Illustration of shaking bag.svg";
// import BoxBottomAfterRoll from /*url:*/"../images/Box Bottom After Roll.svg";
// import BoxBottomAllDiceInPlace from /*url:*/"../images/Box Bottom All DIce In Place.svg";
// import ScanDiceKeyImage from /*url:*/"../images/Scanning a DiceKey.svg";
// import SealBox from /*url:*/"../images/Seal Box.svg";
// import { DiceKeyView } from "./WithSelectedDiceKey/DiceKeyView";
// import { ScanDiceKeyView } from "./LoadingDiceKeys/ScanDiceKeyView";
// import { Spacer, ResizableImage, Instruction } from "./basics";

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
  DiceKey = "DiceKey,"
}

export class BackupState {
  diceKeyScanned?: DiceKey;
  setDiceKeyScanned = action ( (diceKey?: DiceKey) => {
    this.diceKeyScanned = diceKey;
  })
  backupMedium?: BackupMedium;
  setBackupMedium = (newMedium: BackupMedium) => action ( () => this.backupMedium = newMedium );
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

const StepSelectBackupMedium = observer (({state}: {state: BackupState}) => {
  return (
    <div style={{display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center"}}>
      <button onClick={state.setBackupMedium(BackupMedium.SticKey)}>Use SticKey</button>
      <button onClick={state.setBackupMedium(BackupMedium.SticKey)}>Use DiceKey</button>
   </div>
)});

const BackupStepSwitchView = observer ( (props: {state: BackupState}) => {
  switch (props.state.step) {
    case Step.SelectBackupMedium: return (<StepSelectBackupMedium {...props} />);
    default: return (<></>);
  }

});

interface BackupViewProps {
  state: BackupState;
  onComplete: (diceKeyLoaded?: DiceKey) => any;
}
export const BackupView = observer ( (props: BackupViewProps) => {
  const {state, onComplete} = props;
  return (
    <div className={Layout.RowStretched}>
      <div className={Layout.ColumnStretched}>
        <SimpleTopNavBar title={"Assembly Instructions"} goBack={ () => onComplete() } />
        <div className={Layout.PaddedStretchedColumn}>
          <BackupStepSwitchView state={state} />
          <StepFooterView setStep={state.setStep} pprev={undefined} prev={state.stepMinus1} next={state.stepPlus1} />
        </div>
      </div>
    </div>
  )
});


export const Preview_BackupView = () => {
  return (
    <BackupView state={new BackupState(Step.SelectBackupMedium)} onComplete={ () => {} } />
  );
};
