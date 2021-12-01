import { BackupViewState } from "../BackupView/BackupViewState";
import { HasSubViews } from "../../state/core";
import { DiceKeyState } from "../../state/Window/DiceKeyState";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { addressBarState } from "../../state/core/AddressBarState";

export enum SelectedDiceKeySubViews {
  DisplayDiceKey = "", // primary view
  Backup = "backup",
  SeedHardwareKey = "seed",
  DeriveSecrets = "secret",
}

const getSelectedDiceKeySubViewFromPath = (
  path: string
): SelectedDiceKeySubViews => {
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

const basePath = RUNNING_IN_ELECTRON? `/` : `${window.location.protocol}//${window.location.host}`;

const replacePathElement = (indexOfPathElementToReplace: number, newPathElement: string) => {
  const pathElements = (addressBarState.path || "/").split('/');
  pathElements[indexOfPathElementToReplace] = newPathElement
  return `${basePath}${pathElements.join('/')}`;
}

export class SelectedDiceKeyViewState extends HasSubViews<SelectedDiceKeySubViews> {
  constructor(
    public readonly foregroundDiceKeyState: DiceKeyState,
    initialSubView: SelectedDiceKeySubViews = getSelectedDiceKeySubViewFromPath(addressBarState.path)
  ) {
    super(initialSubView, () => this.updateAddressBar());
    this.backupState = new BackupViewState(this.foregroundDiceKeyState);

    addressBarState.onPopState( path => 
      this.rawSetSubView(getSelectedDiceKeySubViewFromPath(path))
    );
  }

  private updateAddressBar = () => { // (newSubView: SelectedDiceKeySubViews, priorSubView: SelectedDiceKeySubViews | undefined) => {
    const subViewInAddressBar = getSelectedDiceKeySubViewFromPath(addressBarState.path);
    const newPath = replacePathElement(2, this.subView ?? "");
    if (this.subView === SelectedDiceKeySubViews.DisplayDiceKey && subViewInAddressBar !== SelectedDiceKeySubViews.DisplayDiceKey) {
      // We're popping from a subview to the display dicekey view
      console.log(`updateAddressBar.back ${JSON.stringify(subViewInAddressBar)} ${JSON.stringify(this.subView)}`);
      addressBarState.back();
    } else if (this.subView !== SelectedDiceKeySubViews.DisplayDiceKey && subViewInAddressBar == SelectedDiceKeySubViews.DisplayDiceKey ) { 
      // We're moving down from the primary view (displaying a dicekey) and pushing a subview
      console.log(`updateAddressBar.pushState ${JSON.stringify(subViewInAddressBar)} ${JSON.stringify(this.subView)}`);
      addressBarState.pushState(newPath);
    } else {
      // we're moving laterally from one subview to another
      console.log(`updateAddressBar.replaceState ${JSON.stringify(subViewInAddressBar)} ${JSON.stringify(this.subView)}`);
      addressBarState.replaceState(newPath);
    }
  }

  backupState: BackupViewState;

  navigateToDisplayDiceKey = this.navigateToSubView(SelectedDiceKeySubViews.DisplayDiceKey);
  navigateToBackup = this.navigateToSubView(SelectedDiceKeySubViews.Backup);
  navigateToSeedHardwareKey = this.navigateToSubView(SelectedDiceKeySubViews.SeedHardwareKey);
  navigateToDeriveSecrets = this.navigateToSubView(SelectedDiceKeySubViews.DeriveSecrets);

}
