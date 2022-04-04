import { BackupViewState, BackupViewStateName } from "../BackupView/BackupViewState";
import { SubViewState } from "../../state/core";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { SeedHardwareKeyViewState, SeedHardwareKeyViewStateName } from "../Recipes/SeedHardwareKeyViewState"
import { SecretDerivationViewState, SecretDerivationViewStateName } from "../../views/Recipes/DerivationView";
import { DiceKeyMemoryStore } from "../../state";
import { addressBarState } from "../../state/core/AddressBarState";
import {
  SaveOrDeleteDiceKeyViewState,
  SaveDiceKeyViewState, SaveDiceKeyViewStateName,
  DeleteDiceKeyViewState, DeleteDiceKeyViewStateName
} from "../../views/SaveAndDeleteDiceKeyView";

export const DisplayDiceKeyViewStateName = "";
export type DisplayDiceKeyViewStateName = typeof DisplayDiceKeyViewStateName;
export class DisplayDiceKeyViewState implements ViewState {
  readonly viewName = DisplayDiceKeyViewStateName;
  navState: NavigationPathState;
  constructor(parentNavState: NavigationPathState, public readonly diceKey: DiceKeyWithKeyId) {
    this.navState = new NavigationPathState(parentNavState, DisplayDiceKeyViewStateName)
  }
  // toPath = () => ``;
}

export type SelectedDiceKeySubViewStates =
  DisplayDiceKeyViewState |
  BackupViewState |
  SeedHardwareKeyViewState |
  SecretDerivationViewState |
  SaveDiceKeyViewState |
  DeleteDiceKeyViewState;
export type SelectedDiceKeySubViewStateNames = SelectedDiceKeySubViewStates["viewName"];

export const SelectedDiceKeyViewStateName = "SelectedDiceKey";
export type SelectedDiceKeyViewStateName = typeof SelectedDiceKeyViewStateName;
export class SelectedDiceKeyViewState implements ViewState<SelectedDiceKeyViewStateName> {
  readonly viewName = SelectedDiceKeyViewStateName;

  _displayDiceKeyViewState?: DisplayDiceKeyViewState;
  get displayDiceKeyViewState() { return this._displayDiceKeyViewState ||= new DisplayDiceKeyViewState(this.navState, this.diceKey) }
  _backupViewState?: BackupViewState;
  get backupViewState() { return this._backupViewState ||= new BackupViewState(this.navState, {diceKey: this.diceKey}) }
  _seedHardwareKeyViewState?: SeedHardwareKeyViewState;
  get seedHardwareKeyViewState() { return this._seedHardwareKeyViewState ||= new SeedHardwareKeyViewState(this.navState, this.diceKey) }
  _secretDerivationViewState?: SecretDerivationViewState;
  get secretDerivationViewState() { return this._secretDerivationViewState ||= new SecretDerivationViewState(this.navState, this.diceKey) }

  navState: NavigationPathState;
  subView: SubViewState<SelectedDiceKeySubViewStates>;

  get subViewState() { return this.subView.subViewState ?? this.displayDiceKeyViewState }
  constructor(
    parentNavState: NavigationPathState, 
    public readonly diceKey: DiceKeyWithKeyId,
  ) {
    this.navState = new NavigationPathState(parentNavState, diceKey.centerLetterAndDigit, () => this.subViewState.navState.fromHereToEndOfPathInclusive );
    this.subView = new SubViewState<SelectedDiceKeySubViewStates>(this.viewName, this.navState, this.displayDiceKeyViewState);
    this.subView.subStateChangedEvent.on( (_prevState, _currentState) => {
      const diceKeyIsInMemory = DiceKeyMemoryStore.hasKeyIdInMemory(diceKey.keyId);
      console.log(`SelectedDiceKeyView subview state changed from ${_prevState?.viewName ?? "undefined"} to ${_currentState?.viewName ?? "undefined"} and DiceKeyInMemory=${diceKeyIsInMemory ? "true" : "false"}`)
      if (!diceKeyIsInMemory) {
        // We've navigated to this view after the key has been deleted from memory.
        console.log(`Arrived at SelectedDiceKeyView with deleted DiceKey. Must have returned from deleted state`);
        addressBarState.back();
      }
    })
  }

  /**
   * 
   * @param diceKey The DiceKey of the selected state
   * @param subPathElements The elements of the address bar split by forward slashes, with the initial
   * letter and digit used to identify the DiceKey removed, such that
   * the path `/M1/a/b` would result in the `subPathElements` array of `["a", "b"]`.
   */
  static fromPath = (parentNavState: NavigationPathState, diceKey: DiceKeyWithKeyId, subPathElements: string[] = []): SelectedDiceKeyViewState => {
    const instance = new SelectedDiceKeyViewState(parentNavState, diceKey);
    if (subPathElements.length > 0) {
      const subViewName = subPathElements[0];
      switch (subViewName) {
        case BackupViewStateName:
          instance.subView.rawSetSubView(instance._backupViewState = BackupViewState.fromPath(instance.navState, diceKey, subPathElements));
          break;
        case SeedHardwareKeyViewStateName:
          instance.subView.rawSetSubView(instance.seedHardwareKeyViewState);
          break;
        case SecretDerivationViewStateName:
          instance.subView.rawSetSubView(instance.secretDerivationViewState);
          break;
        default:
          break;
      }
    }
    return instance;
  }

  navigateToSubViewAndReplaceState = (state: SelectedDiceKeySubViewStates) => {
      this.subView.navigateToReplaceState(state);
      return this;
  }

  navigateToDisplayDiceKey = () => this.navigateToSubViewAndReplaceState(this.displayDiceKeyViewState);
  navigateToBackup = () => this.navigateToSubViewAndReplaceState(this.backupViewState);
  navigateToSeedHardwareKey = () => this.navigateToSubViewAndReplaceState(this.seedHardwareKeyViewState);
  navigateToDeriveSecrets = () => this.navigateToSubViewAndReplaceState(this.secretDerivationViewState);

  navigateToDeleteView = () => this.subView.navigateToPushState(new SaveOrDeleteDiceKeyViewState(DeleteDiceKeyViewStateName, this.navState, this.diceKey, DeleteDiceKeyViewStateName));
  navigateToSaveView = () => this.subView.navigateToPushState(new SaveOrDeleteDiceKeyViewState(SaveDiceKeyViewStateName, this.navState, this.diceKey, SaveDiceKeyViewStateName));
}
