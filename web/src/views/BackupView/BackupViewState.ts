import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { PhysicalMedium } from "../../dicekeys/PhysicalMedium";
import { ValidateBackupViewState } from "./ValidateBackupViewState";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { SettableOptionalDiceKey, WithDiceKey } from "../../state/Window/DiceKeyState";

export enum BackupStep {
  SelectBackupMedium = 1,
  Introduction,
  FirstFace,
  LastFace = FirstFace + 24,
  Validate,
  END_EXCLUSIVE,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  START_INCLUSIVE = 1,
}

export const BackupViewStateName = "backup";
export class BackupViewState implements ViewState<typeof BackupViewStateName> {
  readonly viewName = BackupViewStateName;
  public step: BackupStep;
  navState: NavigationPathState;
  constructor(
    parentNavState: NavigationPathState,
    readonly withDiceKey: SettableOptionalDiceKey | WithDiceKey,
    public startAtStep: BackupStep = BackupStep.START_INCLUSIVE,
    backupMedium: PhysicalMedium | undefined = undefined,
  ) {
    this.navState = new NavigationPathState(parentNavState, BackupViewStateName, () => this.step != BackupStep.START_INCLUSIVE ? this.step.toString() : "");
    this.step = startAtStep;
    this.backupMedium = backupMedium;
    this.validationStepViewState = new ValidateBackupViewState(this.withDiceKey);
    makeAutoObservable(this);
  }

  validStepOrUndefined = (step: number): BackupStep | undefined =>
  (step >= this.startAtStep && step < BackupStep.END_EXCLUSIVE) ? step : undefined;


  /**
   * 
   * @param diceKey The DiceKey of the selected state
   * @param subPathElements The elements of the address bar split by forward slashes, with the elements
   * for the parent views removed, such that
   * the path `/M1/backup/3` would result in the `fromPathElements` array of `["backup", "3"]`.
   */
  static fromPath = (parentNavState: NavigationPathState, diceKey: DiceKeyWithKeyId, subPathElements: string[] = []): BackupViewState => {
    const pathStep = subPathElements.length < 2 ? BackupStep.START_INCLUSIVE : parseInt(subPathElements[1] ?? "${BackupStep.START_INCLUSIVE}");
    const step = pathStep >= BackupStep.START_INCLUSIVE && pathStep < BackupStep.END_EXCLUSIVE ? pathStep : BackupStep.START_INCLUSIVE;
    return new BackupViewState( parentNavState, {diceKey}, step);
  }

  validationStepViewState: ValidateBackupViewState;
  backupMedium?: PhysicalMedium;
//  diceKeyScannedFromBackup = DiceKeyWithoutKeyId;

  setBackupMedium = (newMedium: PhysicalMedium) => action ( () => {
    this.backupMedium = newMedium;
    this.step = BackupStep.SelectBackupMedium + 1;
  });
  setStep = action ( (step: BackupStep) => {
    if (step === BackupStep.Validate) {
      // If moving to the validation step, and if we had tried scanning a key to validate before,
      // clear what we scanned
//      this.diceKeyScannedFromBackup.clear();
      this.validationStepViewState.clear();
    }
    this.step = step;
  });
  setStepTo = (step?: BackupStep) => step == null ? undefined : () => this.setStep(step);
  get stepPlus1() {
    return this.validStepOrUndefined(this.step+1)
  }
  get stepMinus1() { return this.validStepOrUndefined(this.step-1) }

  userChoseToSkipValidationStep: boolean = false;
  setUserChoseToSkipValidationStep = action ( () => this.userChoseToSkipValidationStep = true );

  get backupValidated() { return this.validationStepViewState.backupScannedSuccessfully }

  clear = action ( () => {
    this.backupMedium = undefined;
    this.step = BackupStep.START_INCLUSIVE;
  })

}