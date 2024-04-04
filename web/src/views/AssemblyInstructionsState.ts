
import { action, makeAutoObservable } from "mobx";
import { BackupDiceKeyState } from "./BackupView/BackupDiceKeyState";
import { ViewState } from "../state/core/ViewState";
import { NavigationPathState } from "../state/core/NavigationPathState";
import { addressBarState } from "../state/core/AddressBarState";
import { GetSetDiceKey } from "./WithSelectedDiceKey/GetSetDiceKey";
import { BackupStatus, BackupStatusCompletedAndValidated, BackupStatusCompletedWithoutValidation } from "./BackupView/BackupStatus";

export enum AssemblyInstructionsStep {
  Randomize = 1,
  DropDice,
  FillEmptySlots,
  ScanFirstTime,
  CreateBackup,
  SealBox,
  Done,
  END_EXCLUSIVE,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  START_INCLUSIVE = 1,
}

const validStepOrUndefined = (step: number): AssemblyInstructionsStep | undefined =>
  (step >= AssemblyInstructionsStep.START_INCLUSIVE && step < AssemblyInstructionsStep.END_EXCLUSIVE) ? step : undefined;

export const AssemblyInstructionsStateName = "assemble";
export type AssemblyInstructionsStateName = typeof AssemblyInstructionsStateName;
export class AssemblyInstructionsState implements ViewState {
  readonly viewName = AssemblyInstructionsStateName;

  getSetDiceKey: GetSetDiceKey;
  get diceKey() { return this.getSetDiceKey.getDiceKey(); }
  // diceKey: DiceKey | undefined;
  // setDiceKey = action( (diceKey: DiceKey | undefined) => {
  //   if (diceKey == null) {
  //     this.diceKey = diceKey;
  //   } else if (diceKey instanceof DiceKeyWithKeyId) {
  //     this.diceKey = DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey);
  //   } else {
  //     diceKey.withKeyId.then( diceKeyWithKeyId => {
  //       this.setDiceKey(diceKeyWithKeyId);
  //     });
  //   }
  // });

  setStep = action ( (step?: AssemblyInstructionsStep) => { if (step != null && step !=this.step) {
    // if (step === AssemblyInstructionsStep.CreateBackup && (this.backupState == null || this.backupState.diceKey. != this.diceKey)) {
    //   // Need to create a backup state based on the currently-loaded DiceKey
    //   this.backupState = new BackupViewState(this.navState, {
    //     getDiceKey: this.diceKeyState.getDiceKey,
    //     setDiceKey: this.diceKeyState.setDiceKey,
    //   })
    // }
    addressBarState.replaceState(this.navState.getPath, () => {
      this.ensureVisible();
      this.step = step;
    })
  } } );
  get goToNextStep(): (() => void) | undefined {
    const {stepPlus1} = this;
    return stepPlus1 == null ? undefined : (() => this.setStep(stepPlus1))
  }
  get goToPrevStep() { const {stepMinus1} = this; return stepMinus1 == null ? undefined : () => this.setStep(stepMinus1) }
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

  userChoseToSkipBackupStep: boolean = false;
  setUserChoseToSkipBackupStep = action ( () => this.userChoseToSkipBackupStep = true );

  backupState: BackupDiceKeyState;
  step: AssemblyInstructionsStep;

  backupStatus: BackupStatus | undefined;
  setBackupStatus = action ( (backupStatus: BackupStatus | undefined) => { this.backupStatus = backupStatus; } );
  get backedUpSuccessfully() { return this.backupStatus === BackupStatusCompletedAndValidated || this.backupStatus === BackupStatusCompletedWithoutValidation }


  navState: NavigationPathState;
  constructor(
    parentNavState: NavigationPathState,
    protected ensureVisible: () => void,
    {step = AssemblyInstructionsStep.START_INCLUSIVE, ...getSetDiceKey}: GetSetDiceKey & {
      step?: AssemblyInstructionsStep
    }
  ) {
    this.navState = new NavigationPathState(parentNavState, () => `${AssemblyInstructionsStateName}/${this.step}` );
    this.step = step;
    this.getSetDiceKey = getSetDiceKey;
    this.backupState = new BackupDiceKeyState(this.navState, getSetDiceKey)
    makeAutoObservable(this);
  }
}
