import { BackupViewState, BackupViewStateName } from "../BackupView/BackupViewState";
import { SubViewState } from "../../state/core";
import { addressBarState } from "../../state/core/AddressBarState";
import { NavState, ViewState } from "../../state/core/ViewState";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { SeedHardwareKeyViewState, SeedHardwareKeyViewStateName } from "../Recipes/SeedHardwareKeyViewState"
import { SecretDerivationViewState, SecretDerivationViewStateName } from "../../views/Recipes/DerivationView";
// import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
// import { action, makeAutoObservable } from "mobx";


export const DisplayDiceKeyViewStateName = "";
export type DisplayDiceKeyViewStateName = typeof DisplayDiceKeyViewStateName;
export class DisplayDiceKeyViewState implements ViewState {
  readonly viewName = DisplayDiceKeyViewStateName;
  navState: NavState;
  constructor(parentNavState: NavState, public readonly diceKey: DiceKeyWithKeyId) {
    this.navState = new NavState(parentNavState, DisplayDiceKeyViewStateName)
  }
  // toPath = () => ``;
}

export type SelectedDiceKeySubViewStates =
  DisplayDiceKeyViewState |
  BackupViewState |
  SeedHardwareKeyViewState |
  SecretDerivationViewState;
export type SelectedDiceKeySubViewStateNames = SelectedDiceKeySubViewStates["viewName"];

// const basePath = RUNNING_IN_ELECTRON? `/` : `${window.location.protocol}//${window.location.host}`;

// const replacePathElement = (indexOfPathElementToReplace: number, newPathElement: string) => {
//   const pathElements = (addressBarState.path || "/").split('/');
//   pathElements[indexOfPathElementToReplace] = newPathElement
//   return `${basePath}${pathElements.join('/')}`;
//}

// class SaveAndDeleteUIState {
//   _showSaveDeleteModal: boolean = false;
//   get showSaveDeleteModal() { return this._showSaveDeleteModal }
//   readonly setShowSaveDeleteModal = action( (newValue: boolean) => this._showSaveDeleteModal = newValue);
//   readonly setShowSaveDeleteModalFn = (newValue: boolean) => () => this.setShowSaveDeleteModal(newValue);
//   readonly toggleShowSaveDeleteModal = () => this.setShowSaveDeleteModal(!this.showSaveDeleteModal);

//   get isSaved(): boolean {return this.diceKeyState.diceKey != null && EncryptedDiceKeyStore.has(this.diceKeyState.diceKey); }

//   handleOnSaveDeleteButtonClicked = () => {
//     const {diceKey} = this.diceKeyState;
//     if (diceKey == null) return;
//     if (this.isSaved) {
//       EncryptedDiceKeyStore.delete(diceKey);
//     } else {
//       EncryptedDiceKeyStore.add(diceKey);
//     }
//     this.setShowSaveDeleteModal(false);
//   }

//   constructor(private diceKeyState: DiceKeyState) {
//     makeAutoObservable(this);
//   }
// }

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

  navState: NavState;
  subView: SubViewState<SelectedDiceKeySubViewStates>;

  get subViewState() { return this.subView.subViewState ?? this.displayDiceKeyViewState }
  constructor(
    parentNavState: NavState, 
    public readonly diceKey: DiceKeyWithKeyId,
  ) {
    this.navState = new NavState(parentNavState, diceKey.centerLetterAndDigit, () => this.subViewState.navState.fromHereToEndOfPathInclusive );
    this.subView = new SubViewState<SelectedDiceKeySubViewStates>(this.navState, this.displayDiceKeyViewState);
  }

  // get pathExclusiveOfSubViews(): string { return `${this.basePath}/${this.diceKey.centerLetterAndDigit}` }
  // get path(): string { return this.subViewState?.path ?? this.pathExclusiveOfSubViews }

  /**
   * 
   * @param diceKey The DiceKey of the selected state
   * @param subPathElements The elements of the address bar split by forward slashes, with the initial
   * letter and digit used to identify the DiceKey removed, such that
   * the path `/M1/a/b` would result in the `subPathElements` array of `["a", "b"]`.
   */
  static fromPath = (parentNavState: NavState, diceKey: DiceKeyWithKeyId, subPathElements: string[] = []): SelectedDiceKeyViewState => {
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

  pushAddressBarNavigationState = (restoreStateFn: () => void) => {
    addressBarState.pushState(this.navState.getPath(), restoreStateFn)
  }

  // navigateToSubViewAndPushState = (state: SelectedDiceKeySubViewStates) => {
  //   if (this.subViewState === state) return this;
  //   addressBarState.pushState(state.toPath(), () => {
  //     // On back, set the subViewState to null
  //     this.navigateTo();
  //   })
  //   this.navigateTo(state);
  //   return this;
  // }

  navigateToSubViewAndReplaceState = (state: SelectedDiceKeySubViewStates) => {
    if (this.subViewState !== state) {
      this.subView.navigateTo(state);
      this.subView.navState.replaceAddressBarNavigationState();
    }
    return this;
  }

  navigateToDisplayDiceKey = () => this.navigateToSubViewAndReplaceState(this.displayDiceKeyViewState);
  navigateToBackup = () => this.navigateToSubViewAndReplaceState(this.backupViewState);
  navigateToSeedHardwareKey = () => this.navigateToSubViewAndReplaceState(this.seedHardwareKeyViewState);
  navigateToDeriveSecrets = () => this.navigateToSubViewAndReplaceState(this.secretDerivationViewState);
}
