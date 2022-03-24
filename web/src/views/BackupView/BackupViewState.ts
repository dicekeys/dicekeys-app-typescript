import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { BackupMedium } from "./BackupMedium";
import { ValidateBackupViewState } from "./ValidateBackupViewState";
import { DiceKeyState } from "../../state/Window/DiceKeyState";
import { ViewState } from "../../state/core/ViewState";

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

// interface SettableDiceKeyState {
//   diceKey?: DiceKey,
//   setDiceKey: (diceKey?: DiceKey) => any;
// }

export const BackupViewStateName = "backup";
export class BackupViewState implements ViewState<typeof BackupViewStateName> {
  constructor(
    public readonly diceKey: DiceKeyWithKeyId,
    public step: BackupStep = BackupStep.START_INCLUSIVE
  ) {
    this.validationStepViewState = new ValidateBackupViewState(this.diceKey, this.diceKeyScannedFromBackup);
    makeAutoObservable(this);
  }
  readonly viewName = BackupViewStateName;

  toPath = () => `/${this.viewName}/${this.step != BackupStep.START_INCLUSIVE ? this.step : ""}`;

  /**
   * 
   * @param diceKey The DiceKey of the selected state
   * @param subPathElements The elements of the address bar split by forward slashes, with the elements
   * for the parent views removed, such that
   * the path `/M1/backup/3` would result in the `fromPathElements` array of `["backup", "3"]`.
   */
  static fromPath = (diceKey: DiceKeyWithKeyId, subPathElements: string[] = []): BackupViewState => {
    const pathStep = subPathElements.length < 2 ? BackupStep.START_INCLUSIVE : parseInt(subPathElements[1] ?? "${BackupStep.START_INCLUSIVE}");
    const step = pathStep >= BackupStep.START_INCLUSIVE && pathStep < BackupStep.END_EXCLUSIVE ? pathStep : BackupStep.START_INCLUSIVE;
    return new BackupViewState(diceKey, step);
  }

  validationStepViewState: ValidateBackupViewState;
  backupMedium?: BackupMedium;
  diceKeyScannedFromBackup = new DiceKeyState();

  setBackupMedium = (newMedium: BackupMedium) => action ( () => {
    this.backupMedium = newMedium;
    this.step = BackupStep.SelectBackupMedium + 1;
  });
  setStep = action ( (step: BackupStep) => {
    if (step === BackupStep.Validate) {
      // If moving to the validation step, and if we had tried scanning a key to validate before,
      // clear what we scanned
      this.diceKeyScannedFromBackup.clear();
      this.validationStepViewState.clear();
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
    this.diceKeyScannedFromBackup.clear();
    this.step = BackupStep.START_INCLUSIVE;
  })

}