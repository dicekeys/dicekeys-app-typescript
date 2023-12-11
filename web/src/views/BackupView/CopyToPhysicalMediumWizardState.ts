import { DiceKey } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { HandGeneratedBackupMedium, HandGeneratedBackupMediumDice, HandGeneratedBackupMediumStickers } from "../../dicekeys/PhysicalMedium";
import { ValidateBackupViewState } from "./ValidateBackupViewState";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { CopyToPhysicalMediumStep } from "./BackupDiceKeyState";

//export const CopyToPhysicalMediumViewStateName = "copy";

export class CopyToPhysicalMediumWizardState implements ViewState {
  //  readonly viewName = CopyToPhysicalMediumViewStateName;
  public step: CopyToPhysicalMediumStep;
  navState: NavigationPathState;

  getDiceKey: () => DiceKey | undefined;

  userChoseToSkipValidationStep: boolean = false;
  validationStepViewState: ValidateBackupViewState;

  setUserChoseToSkipValidationStep = action(() => this.userChoseToSkipValidationStep = true);

  get backupValidated() { return this.validationStepViewState.backupScannedSuccessfully; }

  constructor(
    parentNavState: NavigationPathState,
    public readonly medium: HandGeneratedBackupMedium,
    // readonly withDiceKey: SettableOptionalDiceKey | WithDiceKey,
    // startAtStep: BackupStep = BackupStep.START_INCLUSIVE,
    // backupMedium: PhysicalMedium | undefined = undefined,
    {
      step = CopyToPhysicalMediumStep.START_INCLUSIVE,
      ...validateBackupViewStateConstructorParameters
    }: {
      step?: CopyToPhysicalMediumStep;
      getDiceKey: () => DiceKey | undefined,
      setDiceKey?: (diceKey: DiceKey) => void,
    }
  ) {
    this.getDiceKey = validateBackupViewStateConstructorParameters.getDiceKey;
    this.navState = new NavigationPathState(parentNavState, medium, () => this.step != CopyToPhysicalMediumStep.START_INCLUSIVE ? this.step.toString() : "");
    this.step = step;
    this.validationStepViewState = new ValidateBackupViewState(validateBackupViewStateConstructorParameters);
    makeAutoObservable(this);
  }

  validStepOrUndefined = (step: number): CopyToPhysicalMediumStep | undefined => (step >= CopyToPhysicalMediumStep.START_INCLUSIVE && step < CopyToPhysicalMediumStep.END_EXCLUSIVE) ? step : undefined;


  /**
   *
   * @param getDiceKey Gets the dice key to be copied to a physical medium
   * @param subPathElements The elements of the address bar split by forward slashes, with the elements
   * for the parent views removed, such that
   * the path `/M1/backup/stickers/3` would result in the `fromPathElements` array of
   * `["backup", "stickers", "3"]`.
   */
  static fromPath = (parentNavState: NavigationPathState, getDiceKey: () => DiceKey | undefined, subPathElements: string[] = []) => {
    const [, medium, stepNumberStr] = subPathElements;
    const pathStep = stepNumberStr == null ? CopyToPhysicalMediumStep.START_INCLUSIVE : parseInt(stepNumberStr);
    const step = pathStep >= CopyToPhysicalMediumStep.START_INCLUSIVE && pathStep < CopyToPhysicalMediumStep.END_EXCLUSIVE ? pathStep : CopyToPhysicalMediumStep.START_INCLUSIVE;
    if (medium === HandGeneratedBackupMediumDice || medium === HandGeneratedBackupMediumStickers) {
      return new CopyToPhysicalMediumWizardState(parentNavState, medium, { getDiceKey, step });
    }
    return;
  };

  setStep = action((step: CopyToPhysicalMediumStep) => {
    if (step === CopyToPhysicalMediumStep.Validate) {
      this.validationStepViewState.clear();
    }
    this.step = step;
  });
  setStepTo = (step?: CopyToPhysicalMediumStep) => step == null ? undefined : () => this.setStep(step);
  get stepPlus1() {
    return this.validStepOrUndefined(this.step + 1);
  }
  get stepMinus1() { return this.validStepOrUndefined(this.step - 1); }

  clear = action(() => {
    this.step = CopyToPhysicalMediumStep.START_INCLUSIVE;
  });

}
