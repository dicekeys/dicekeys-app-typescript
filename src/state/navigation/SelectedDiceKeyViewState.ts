import { HasSubViews } from "../core";
import { ForegroundDiceKeyState } from "./ForegroundDiceKeyState";

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
    public readonly foregroundDiceKeyState: ForegroundDiceKeyState,
    initialSubView: SelectedDiceKeySubViews = SelectedDiceKeySubViews.DisplayDiceKey
  ) {
    super(initialSubView);
  }

  navigateToDisplayDiceKey = this.navigateToSubView(SelectedDiceKeySubViews.DisplayDiceKey);
  navigateToBackup = this.navigateToSubView(SelectedDiceKeySubViews.Backup);
  navigateToSeedHardwareKey = this.navigateToSubView(SelectedDiceKeySubViews.SeedHardwareKey);
  navigateToDeriveSecrets = this.navigateToSubView(SelectedDiceKeySubViews.DeriveSecrets);

}
