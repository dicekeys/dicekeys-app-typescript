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
    public readonly foregroundDiceKeyState: DiceKeyState,
    initialSubView: SelectedDiceKeySubViews = getSelectedDiceKeySubViewFromPath()
  ) {
    super(initialSubView, () => this.updateAddressBar());

    window.addEventListener('popstate', (_: PopStateEvent) => {
      this.rawSetSubView(getSelectedDiceKeySubViewFromPath());
    });
  }

  private updateAddressBar = () => { // (newSubView: SelectedDiceKeySubViews, priorSubView: SelectedDiceKeySubViews | undefined) => {
    const subViewInAddressBar = getSelectedDiceKeySubViewFromPath();
    const newPath = replacePathElement(2, this.subView ?? "");
    if (this.subView === SelectedDiceKeySubViews.DisplayDiceKey && subViewInAddressBar !== SelectedDiceKeySubViews.DisplayDiceKey) {
      // We're popping from a subview to the display dicekey view
      console.log(`updateAddressBar.back ${JSON.stringify(subViewInAddressBar)} ${JSON.stringify(this.subView)}`);
      window.history.back();
    } else if (this.subView !== SelectedDiceKeySubViews.DisplayDiceKey && subViewInAddressBar == SelectedDiceKeySubViews.DisplayDiceKey ) { 
      // We're moving down from the primary view (displaying a dicekey) and pushing a subview
      console.log(`updateAddressBar.pushState ${JSON.stringify(subViewInAddressBar)} ${JSON.stringify(this.subView)}`);
      window.history.pushState({}, '', newPath);
    } else {
      // we're moving laterally from one subview to another
      console.log(`updateAddressBar.replaceState ${JSON.stringify(subViewInAddressBar)} ${JSON.stringify(this.subView)}`);
      window.history.replaceState({}, '', newPath);
    }
  }

  backupState = new BackupViewState(this.foregroundDiceKeyState);

  navigateToDisplayDiceKey = this.navigateToSubView(SelectedDiceKeySubViews.DisplayDiceKey);
  navigateToBackup = this.navigateToSubView(SelectedDiceKeySubViews.Backup);
  navigateToSeedHardwareKey = this.navigateToSubView(SelectedDiceKeySubViews.SeedHardwareKey);
  navigateToDeriveSecrets = this.navigateToSubView(SelectedDiceKeySubViews.DeriveSecrets);

}
