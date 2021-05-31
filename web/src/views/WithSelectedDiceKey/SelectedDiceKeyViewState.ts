import { BackupViewState } from "../BackupView/BackupViewState";
import { HasSubViews } from "../../state/core";
import { DiceKeyState } from "../../state/Window/DiceKeyState";

export enum SelectedDiceKeySubViews {
  DisplayDiceKey = "", // primary view
  Backup = "backup",
  SeedHardwareKey = "seed",
  DeriveSecrets = "secret",
}

const getSelectedDiceKeySubViewFromPath = (path: string = window.location.pathname): SelectedDiceKeySubViews => {
  const subViewPathElement = path.split("/")[2];
  switch(subViewPathElement) {
    case SelectedDiceKeySubViews.DisplayDiceKey:
    case SelectedDiceKeySubViews.Backup:
    case SelectedDiceKeySubViews.SeedHardwareKey:
    case SelectedDiceKeySubViews.DeriveSecrets:
      return subViewPathElement;
    default:
      return SelectedDiceKeySubViews.DisplayDiceKey;
  }
}

const replacePathElement = (indexOfPathElementToReplace: number, newPathElement: string) => {
  const pathElements = window.location.pathname.split('/');
  pathElements[indexOfPathElementToReplace] = newPathElement
  return pathElements.join('/');
}

export class SelectedDiceKeyViewState extends HasSubViews<SelectedDiceKeySubViews> {
  constructor(
    public readonly goBack: () => any,
    public readonly foregroundDiceKeyState: DiceKeyState,
    initialSubView: SelectedDiceKeySubViews = getSelectedDiceKeySubViewFromPath()
  ) {
    super(initialSubView, () => {
      // update path
      const newPath = replacePathElement(2, this.subView ?? "");
      window.history.replaceState({}, '', newPath);

      window.addEventListener('popstate', (_: PopStateEvent) => {
        this.rawSetSubView(getSelectedDiceKeySubViewFromPath());
      });
  
    });
  }

  backupState = new BackupViewState(this.foregroundDiceKeyState);

  navigateToDisplayDiceKey = this.navigateToSubView(SelectedDiceKeySubViews.DisplayDiceKey);
  navigateToBackup = this.navigateToSubView(SelectedDiceKeySubViews.Backup);
  navigateToSeedHardwareKey = this.navigateToSubView(SelectedDiceKeySubViews.SeedHardwareKey);
  navigateToDeriveSecrets = this.navigateToSubView(SelectedDiceKeySubViews.DeriveSecrets);

}
