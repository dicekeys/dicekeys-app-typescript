import { BackupViewState } from "../BackupView/BackupViewState";
import { HasSubViews } from "../../state/core";
import { DiceKeyState } from "../../state/Window/DiceKeyState";

export enum SelectedDiceKeySubViews {
  DisplayDiceKey, // primary view
  Backup,
  SeedHardwareKey,
  DeriveSecrets,
//  Save
}

export class SelectedDiceKeyViewState extends HasSubViews<SelectedDiceKeySubViews> {
  constructor(
    public readonly goBack: () => any,
    public readonly foregroundDiceKeyState: DiceKeyState,
    initialSubView: SelectedDiceKeySubViews = SelectedDiceKeySubViews.DisplayDiceKey
  ) {
    super(initialSubView);
  }

  backupState = new BackupViewState(this.foregroundDiceKeyState);

  navigateToDisplayDiceKey = this.navigateToSubView(SelectedDiceKeySubViews.DisplayDiceKey);
  navigateToBackup = this.navigateToSubView(SelectedDiceKeySubViews.Backup);
  navigateToSeedHardwareKey = this.navigateToSubView(SelectedDiceKeySubViews.SeedHardwareKey);
  navigateToDeriveSecrets = this.navigateToSubView(SelectedDiceKeySubViews.DeriveSecrets);

}
