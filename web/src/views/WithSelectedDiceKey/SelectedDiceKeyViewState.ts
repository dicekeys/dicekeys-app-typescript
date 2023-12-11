import { BackupDiceKeyState, BackupDiceKeyStateName } from "../BackupView/BackupDiceKeyState";
import { SubViewState } from "../../state/core";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { DiceKey } from "../../dicekeys/DiceKey";
import { SeedHardwareKeyViewState, SeedHardwareKeyViewStateName } from "../Recipes/SeedHardwareKeyViewState";
import { SecretDerivationViewState, SecretDerivationViewStateName } from "../../views/Recipes/DerivationView";
import { addressBarState } from "../../state/core/AddressBarState";
import {
  SaveDiceKeyViewState, SaveDiceKeyViewStateName,
  DeleteDiceKeyViewState, DeleteDiceKeyViewStateName
} from "../../views/SaveOrDeleteDiceKeyViewState";
import { SaveOrDeleteDiceKeyViewState } from "../../views/SaveOrDeleteDiceKeyViewState";
import { action, makeAutoObservable } from "mobx";
import { LoadDiceKeyViewState } from "../../views/LoadingDiceKeys/LoadDiceKeyViewState";
import { DiceKeyInMemoryStoreState } from "./DiceKeyInMemoryStoreState";

export const DisplayDiceKeyViewStateName = "";
export type DisplayDiceKeyViewStateName = typeof DisplayDiceKeyViewStateName;
export class DisplayDiceKeyViewState implements ViewState {
  readonly viewName = DisplayDiceKeyViewStateName;
  navState: NavigationPathState;
  constructor(parentNavState: NavigationPathState, public readonly selectedDiceKeyVewState: SelectedDiceKeyViewState) {
    this.navState = new NavigationPathState(parentNavState, DisplayDiceKeyViewStateName);
  }
  // toPath = () => ``;
}

export interface GetOptionalSetDiceKey {
  getDiceKey: () => DiceKey | undefined;
  setDiceKey?: (diceKey: DiceKey | undefined) => void;
}

export type SelectedDiceKeySubViewStates =
  DisplayDiceKeyViewState |
  BackupDiceKeyState |
  SeedHardwareKeyViewState |
  SecretDerivationViewState |
  SaveDiceKeyViewState |
  DeleteDiceKeyViewState;
// export type SelectedDiceKeySubViewStateNames = SelectedDiceKeySubViewStates["viewName"];

export const SelectedDiceKeyViewStateName = "SelectedDiceKey";
export type SelectedDiceKeyViewStateName = typeof SelectedDiceKeyViewStateName;
export class SelectedDiceKeyViewState implements ViewState {
  readonly viewName = SelectedDiceKeyViewStateName;

  _displayDiceKeyViewState?: DisplayDiceKeyViewState;
  get displayDiceKeyViewState() { return this._displayDiceKeyViewState ||= new DisplayDiceKeyViewState(this.navState, this) }
  _backupViewState?: BackupDiceKeyState;
  get backupViewState() { return this._backupViewState ||= new BackupDiceKeyState(this.navState, {getDiceKey: this.getDiceKey}) }
  setBackupViewState = action( (backupViewState: BackupDiceKeyState | undefined) => { return this._backupViewState = backupViewState; });
  _seedHardwareKeyViewState?: SeedHardwareKeyViewState;
  get seedHardwareKeyViewState() { return this._seedHardwareKeyViewState ||= new SeedHardwareKeyViewState(this.navState, {getDiceKey: this.getDiceKey, setDiceKey: this.setDiceKey}) }
  _secretDerivationViewState?: SecretDerivationViewState;
  get secretDerivationViewState() { return this._secretDerivationViewState ||= new SecretDerivationViewState(this.navState, {getDiceKey: this.getDiceKey}) }

  navState: NavigationPathState;
  subView: SubViewState<SelectedDiceKeySubViewStates>;

  get getDiceKey() {
    return () => this.selectedDiceKeyState.getDiceKey();
  }
  setDiceKey = (diceKey: DiceKey | undefined) => this.selectedDiceKeyState.setDiceKey(diceKey);

  private _loadDiceKeyViewState: LoadDiceKeyViewState | undefined;
  get loadDiceDiceInProgress(): boolean { return this._loadDiceKeyViewState != null }
  get loadDiceKeyViewState() { return this._loadDiceKeyViewState }
  readonly setLoadDiceKeyViewState = action( (newValue: LoadDiceKeyViewState | undefined) => {
    this._loadDiceKeyViewState = newValue;
  });

  startLoadDiceKey = () => {
    this.setLoadDiceKeyViewState(new LoadDiceKeyViewState());
  }

  onDiceKeyReadOrCancelled = (result: {diceKey: DiceKey} | undefined ) => {
    this.setLoadDiceKeyViewState(undefined);
    this.setDiceKey(result?.diceKey);
  }

  get subViewState() { return this.subView.subViewState ?? this.displayDiceKeyViewState }

  constructor(
    public readonly parentNavState: NavigationPathState,
    public readonly selectedDiceKeyState: DiceKeyInMemoryStoreState,
  ) {
    this.navState = new NavigationPathState(parentNavState, () => selectedDiceKeyState.getDiceKey()?.centerLetterAndDigit ?? "", () => this.subViewState.navState.fromHereToEndOfPathInclusive );
    this.subView = new SubViewState<SelectedDiceKeySubViewStates>(this.viewName, this.navState, this.displayDiceKeyViewState);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.subView.subStateChangedEvent.on( (_prevState, _currentState) => {
      // console.log(`SelectedDiceKeyView subview state changed from ${_prevState?.viewName ?? "undefined"} to ${_currentState?.viewName ?? "undefined"} and DiceKeyInMemory=${diceKeyIsInMemory ? "true" : "false"}`)
      if (this.getDiceKey() == null) {
        // We've navigated to this view after the key has been deleted from memory.
        // console.log(`Arrived at SelectedDiceKeyView with deleted DiceKey. Must have returned from deleted state`);
        addressBarState.back();
      }
    });
    makeAutoObservable(this);
  }

  /**
   * 
   * @param diceKeyIdOrKeyWithId The DiceKey of the selected state
   * @param subPathElements The elements of the address bar split by forward slashes, with the initial
   * letter and digit used to identify the DiceKey removed, such that
   * the path `/M1/a/b` would result in the `subPathElements` array of `["a", "b"]`.
   */
  static fromPath = (parentNavState: NavigationPathState, selectedDiceKeyState: DiceKeyInMemoryStoreState, subPathElements: string[] = []): SelectedDiceKeyViewState => {
    const instance = new SelectedDiceKeyViewState(parentNavState, selectedDiceKeyState);
    if (subPathElements.length > 0) {
      const subViewName = subPathElements[0];
      switch (subViewName) {
        case BackupDiceKeyStateName:
          instance.subView.rawSetSubView(instance.setBackupViewState(BackupDiceKeyState.fromPath(instance.navState, subPathElements, selectedDiceKeyState.getSetDiceKey)));
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

  navigateToDeleteView = () => this.subView.navigateToPushState(new SaveOrDeleteDiceKeyViewState(DeleteDiceKeyViewStateName, this.navState, this.getDiceKey, DeleteDiceKeyViewStateName));
  navigateToSaveView = () => this.subView.navigateToPushState(new SaveOrDeleteDiceKeyViewState(SaveDiceKeyViewStateName, this.navState, this.getDiceKey, SaveDiceKeyViewStateName));
}
