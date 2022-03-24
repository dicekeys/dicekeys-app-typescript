
import { action, makeAutoObservable } from "mobx";
import { BackupViewState } from "./BackupView/BackupViewState";
import { BaseViewState } from "../state/core/ViewState";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../state";

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

export const AssemblyInstructionsStateName = "assemble";
export type AssemblyInstructionsStateName = typeof AssemblyInstructionsStateName;
export class AssemblyInstructionsState extends BaseViewState<AssemblyInstructionsStateName> {
  readonly viewName = AssemblyInstructionsStateName;

  diceKey: DiceKeyWithKeyId | undefined;
  setDiceKey = action( (diceKey: DiceKeyWithKeyId) => {
    DiceKeyMemoryStore.addDiceKeyAsync(diceKey);
    this.diceKey = diceKey;
  } );

  setStep = action ( (step?: AssemblyInstructionsStep) => { if (step != null && step !=this.step) {
    if (step === AssemblyInstructionsStep.CreateBackup && (this.backupState == null || this.backupState.diceKey != this.diceKey)) {
      // Need to create a backup state based on the currently-loaded DiceKey
      const {diceKey} = this;
      if (diceKey == null) {
        console.error(`Attempt to go to backup step without a DiceKey to backup.`)
        return;
      }
      this.backupState = new BackupViewState(diceKey, this.basePath)
    }
    this.step = step;
  } } );
  get goToNextStep(): (() => any) | undefined {
    const {stepPlus1} = this;
    return stepPlus1 == null ? undefined : (() => this.setStep(stepPlus1))
  };
  get goToPrevStep() { const {stepMinus1} = this; return stepMinus1 == null ? undefined : () => this.setStep(stepMinus1) };
  get stepPlus1() { 
    if (this.step === AssemblyInstructionsStep.ScanFirstTime && this.diceKey == undefined) {
      return this.userChoseToSkipScanningStep ? AssemblyInstructionsStep.SealBox : undefined;
    }
    return validStepOrUndefined(this.step+1)
  }
  get stepMinus1() {
    if (this.step === AssemblyInstructionsStep.SealBox && this.diceKey == undefined) {
      return AssemblyInstructionsStep.ScanFirstTime
    }
    return validStepOrUndefined(this.step-1)
  }
  userChoseToSkipScanningStep: boolean = false;
  setUserChoseToSkipScanningStep = action ( () => this.userChoseToSkipScanningStep = true );

  backupState: BackupViewState | undefined;

  constructor(
    basePath: string = "",
    public step: AssemblyInstructionsStep = AssemblyInstructionsStep.START_INCLUSIVE,
  ) {
    super(AssemblyInstructionsStateName, basePath);
    makeAutoObservable(this);
  }
}
