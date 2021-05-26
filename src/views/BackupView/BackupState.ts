import { DiceKey } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { BackupMedium } from "./BackupMedium";
import { ValidateBackupState } from "./ValidateBackup";

export enum BackupStep {
  SelectBackupMedium = 1,
  Introduction,
  FirstFace,
  LastFace = FirstFace + 24,
  Validate,
  END_EXCLUSIVE,
  START_INCLUSIVE = 1,
}

const validStepOrUndefined = (step: number): BackupStep | undefined =>
  (step >= BackupStep.START_INCLUSIVE && step < BackupStep.END_EXCLUSIVE) ? step : undefined;

interface SettableDiceKeyState {
  diceKey?: DiceKey,
  setDiceKey: (diceKey?: DiceKey) => any;
}

export class BackupState {
  backupMedium?: BackupMedium;
  validateBackupState: ValidateBackupState;

  setBackupMedium = (newMedium: BackupMedium) => action ( () => {
    this.backupMedium = newMedium;
    this.step = BackupStep.SelectBackupMedium + 1;
  });
  step: BackupStep;
  setStep = action ( (step: BackupStep) => {
    if (step === BackupStep.Validate) {
      // If moving to the validation step, and if we had tried scanning a key to validate before,
      // clear what we scanned
      this.validateBackupState = new ValidateBackupState(this.diceKeyState);
    }
    this.step = step;
  });
  setStepTo = (step?: BackupStep) => step == null ? undefined : () => this.setStep(step);
  get stepPlus1() {
    return validStepOrUndefined(this.step+1)
  }
  get stepMinus1() { return validStepOrUndefined(this.step-1) }

  userChoseToSkipValidationStep: boolean = false;
  setUserChoseToSkipValidationStep = action ( () => this.userChoseToSkipValidationStep = true );

  clear = action ( () => {
    this.backupMedium = undefined;
    this.validateBackupState.diceKeyScannedFromBackup = undefined;
    this.step = BackupStep.START_INCLUSIVE;
  })

  constructor(
    public readonly diceKeyState: SettableDiceKeyState,
    step: BackupStep = BackupStep.START_INCLUSIVE
  ) {
    this.validateBackupState = new ValidateBackupState(diceKeyState);
    this.step = step;
    makeAutoObservable(this);
  }
}