import { DiceKey } from "../../dicekeys/DiceKey";
import { BackupMedium, HandGeneratedBackupMediumDice, HandGeneratedBackupMediumStickers, MachineGeneratedBackupMediumPrintout, MetaBackupMediumShares } from "../../dicekeys/PhysicalMedium";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { SimpleSecretSharingState } from "../SimpleSecretSharing/SimpleSecretSharingState";
import { SubViewState } from "../../state/core";
import { CopyToPhysicalMediumWizardState } from "./CopyToPhysicalMediumWizardState";

export enum CopyToPhysicalMediumStep {
  Introduction = 1,
  FirstFace,
  LastFace = FirstFace + 24,
  Validate,
  END_EXCLUSIVE,
  END_INCLUSIVE = END_EXCLUSIVE - 1,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  START_INCLUSIVE = 1,
}

export class BackupToPrinterViewState implements ViewState {
  readonly viewName = "print";
  navState: NavigationPathState;
  getDiceKey: () => DiceKey | undefined;
  constructor(parentNavState: NavigationPathState, {
    getDiceKey
  }: {
    getDiceKey: () => DiceKey | undefined
  }) {
    this.navState = new NavigationPathState(parentNavState, this.viewName);
    this.getDiceKey = getDiceKey;
  }
}


type BackupDiceKeySubViewStates = CopyToPhysicalMediumWizardState | SimpleSecretSharingState | BackupToPrinterViewState;

export const BackupDiceKeyStateName = "backup" as const;
export class BackupDiceKeyState implements ViewState {
  readonly viewName = BackupDiceKeyStateName;

  subView: SubViewState<BackupDiceKeySubViewStates>;
  navState: NavigationPathState;
  getDiceKey: () => DiceKey | undefined;
  setDiceKey?: (diceKey: DiceKey | undefined) => void;
  
  // completedSuccessfully = false;
  // setCompletedSuccessfully = action ( () => this.completedSuccessfully = true );

  /**
   * 
   * @param getDiceKey Gets the dice key to be copied to a physical medium
   * @param subPathElements The elements of the address bar split by forward slashes, with the elements
   * for the parent views removed, such that
   * the path `/M1/backup/stickers/3` would result in the `fromPathElements` array of 
   * `["backup", "stickers", "3"]`.
   */
    static fromPath = (parentNavState: NavigationPathState, subPathElements: string[] = [], getSetDiceKey: {
      getDiceKey: () => DiceKey | undefined,
      setDiceKey?: (diceKey: DiceKey | undefined) => void,
    }) => {
      const [, medium, stepNumberStr] = subPathElements;
      const pathStep = stepNumberStr == null ? CopyToPhysicalMediumStep.START_INCLUSIVE : parseInt(stepNumberStr);
      const step = pathStep >= CopyToPhysicalMediumStep.START_INCLUSIVE && pathStep < CopyToPhysicalMediumStep.END_EXCLUSIVE ? pathStep : CopyToPhysicalMediumStep.START_INCLUSIVE;
      if (medium === HandGeneratedBackupMediumDice || medium === HandGeneratedBackupMediumStickers) {
        return new BackupDiceKeyState( parentNavState, {...getSetDiceKey, subView: (navState) => new CopyToPhysicalMediumWizardState(navState, medium, {step, ...getSetDiceKey})} );
      }
      return;
    }

  chooseBackupType = (medium: BackupMedium) => { 
    const getDiceKey = this.getDiceKey;
    if (medium === HandGeneratedBackupMediumDice || medium == HandGeneratedBackupMediumStickers) {
      this.subView.navigateToPushState(
        new CopyToPhysicalMediumWizardState(this.navState, medium, {getDiceKey}));
    } else if (medium === MachineGeneratedBackupMediumPrintout) {
      this.subView.navigateToPushState(
        new BackupToPrinterViewState(this.navState, {getDiceKey}));
    } else if (medium === MetaBackupMediumShares) {
      this.subView.navigateToPushState(
        new SimpleSecretSharingState(this.navState, {getUserSpecifiedDiceKeyToBeShared: this.getDiceKey}));
    }
  }

  constructor(parentNavState: NavigationPathState, {
    getDiceKey,
    setDiceKey,
    subView,
  }: {
    getDiceKey: () => DiceKey | undefined,
    setDiceKey?: (diceKey: DiceKey | undefined) => void,
    subView?: (navState: NavigationPathState) => BackupDiceKeySubViewStates;
  }) {
    this.getDiceKey = getDiceKey;
    this.setDiceKey = setDiceKey;
    this.navState = new NavigationPathState(parentNavState, this.viewName);
    this.subView = new SubViewState<BackupDiceKeySubViewStates>(BackupDiceKeyStateName, parentNavState, subView?.(this.navState));
  }
}

