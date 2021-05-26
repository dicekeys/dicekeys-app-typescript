
import { action, makeAutoObservable } from "mobx";
import { AppTopLevelState } from "../state/navigation";

export enum AssemblyInstructionsStep {
  Randomize = 1,
  DropDice,
  FillEmptySlots,
  ScanFirstTime,
  CreateBackup,
  SealBox,
  Done,
  END_EXCLUSIVE,
  START_INCLUSIVE = 1,
}

const validStepOrUndefined = (step: number): AssemblyInstructionsStep | undefined =>
  (step >= AssemblyInstructionsStep.START_INCLUSIVE && step < AssemblyInstructionsStep.END_EXCLUSIVE) ? step : undefined;

export class AssemblyInstructionsState {
  setStep = action ( (step?: AssemblyInstructionsStep) => { if (step != null) { this.step = step } } );
  get goToNextStep(): (() => any) | undefined {
    if (this.step === (AssemblyInstructionsStep.END_EXCLUSIVE - 1)) {
      return this.goBack
    }
    const {stepPlus1} = this;
    return stepPlus1 == null ? undefined : (() => this.setStep(stepPlus1))
  };
  get goToPrevStep() { const {stepMinus1} = this; return stepMinus1 == null ? undefined : () => this.setStep(stepMinus1) };
  get stepPlus1() { 
    if (this.step === AssemblyInstructionsStep.ScanFirstTime && this.topLevelState.foregroundDiceKeyState.diceKey == undefined) {
      return this.userChoseToSkipScanningStep ? AssemblyInstructionsStep.SealBox : undefined;
    }
    return validStepOrUndefined(this.step+1)
  }
  get stepMinus1() {
    if (this.step === AssemblyInstructionsStep.SealBox && this.topLevelState.foregroundDiceKeyState.diceKey == undefined) {
      return AssemblyInstructionsStep.ScanFirstTime
    }
    return validStepOrUndefined(this.step-1)
  }
  userChoseToSkipScanningStep: boolean = false;
  setUserChoseToSkipScanningStep = action ( () => this.userChoseToSkipScanningStep = true );

  constructor(
    public topLevelState: AppTopLevelState,
    private goBack: () => any,
    public step: AssemblyInstructionsStep = AssemblyInstructionsStep.START_INCLUSIVE,
  ) {
    this.step = step;
    makeAutoObservable(this);
  }
}
