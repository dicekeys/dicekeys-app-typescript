import { BackupViewState, BackupViewStateName } from "../BackupView/BackupViewState";
import { HasSubViews } from "../../state/core";
import { addressBarState } from "../../state/core/AddressBarState";
import { BaseViewState, ViewState } from "../../state/core/ViewState";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { SeedHardwareKeyViewState, SeedHardwareKeyViewStateName } from "../Recipes/SeedHardwareKeyViewState"
import { SecretDerivationViewState, SecretDerivationViewStateName } from "../../views/Recipes/DerivationView";
// import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
// import { action, makeAutoObservable } from "mobx";


export const DisplayDiceKeyViewStateName = "";
export type DisplayDiceKeyViewStateName = typeof DisplayDiceKeyViewStateName;
export class DisplayDiceKeyViewState extends BaseViewState<DisplayDiceKeyViewStateName> {
  constructor(public readonly diceKey: DiceKeyWithKeyId, basePath: string) {
    super(DisplayDiceKeyViewStateName, basePath)
  }
  // toPath = () => ``;
}

type SelectedDiceKeySubViewStates =
  DisplayDiceKeyViewState |
  BackupViewState |
  SeedHardwareKeyViewState |
  SecretDerivationViewState;


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
export class SelectedDiceKeyViewState extends HasSubViews<SelectedDiceKeyViewStateName, SelectedDiceKeySubViewStates["viewName"], SelectedDiceKeySubViewStates> implements ViewState<"SelectedDiceKey"> {
  get subViewState(): SelectedDiceKeySubViewStates {
    return this._subViewState ?? this.displayDiceKeyViewState;
  }

  _displayDiceKeyViewState?: DisplayDiceKeyViewState;
  get displayDiceKeyViewState() { return this._displayDiceKeyViewState ||= new DisplayDiceKeyViewState(this.diceKey, this.pathExclusiveOfSubViews) }
  _backupViewState?: BackupViewState;
  get backupViewState() { return this._backupViewState ||= new BackupViewState(this.diceKey, this.pathExclusiveOfSubViews) }
  _seedHardwareKeyViewState?: SeedHardwareKeyViewState;
  get seedHardwareKeyViewState() { return this._seedHardwareKeyViewState ||= new SeedHardwareKeyViewState(this.diceKey, this.pathExclusiveOfSubViews) }
  _secretDerivationViewState?: SecretDerivationViewState;
  get secretDerivationViewState() { return this._secretDerivationViewState ||= new SecretDerivationViewState(this.diceKey, this.pathExclusiveOfSubViews) }

  constructor(
    public readonly diceKey: DiceKeyWithKeyId,
    basePath: string = ""
  ) {
    super(SelectedDiceKeyViewStateName, basePath);
  }

  get pathExclusiveOfSubViews(): string { return `${this.basePath}/${this.diceKey.centerLetterAndDigit}` }
  get path(): string { return this.subViewState?.path ?? this.pathExclusiveOfSubViews }

  /**
   * 
   * @param diceKey The DiceKey of the selected state
   * @param subPathElements The elements of the address bar split by forward slashes, with the initial
   * letter and digit used to identify the DiceKey removed, such that
   * the path `/M1/a/b` would result in the `subPathElements` array of `["a", "b"]`.
   */
  static fromPath = (diceKey: DiceKeyWithKeyId, basePath: string, subPathElements: string[] = []): SelectedDiceKeyViewState => {
    const instance = new SelectedDiceKeyViewState(diceKey);
    if (subPathElements.length > 0) {
      const subViewName = subPathElements[0];
      switch (subViewName) {
        case BackupViewStateName:
          return instance.rawSetSubView(instance._backupViewState = BackupViewState.fromPath(diceKey, `${basePath}/${diceKey.centerLetterAndDigit}`, subPathElements));
        case SeedHardwareKeyViewStateName:
          return instance.rawSetSubView(instance.seedHardwareKeyViewState);
        case SecretDerivationViewStateName:
          return instance.rawSetSubView(instance.secretDerivationViewState);
        default:
          break;
      }
    }
    return instance;
  }

  pushAddressBarNavigationState = (restoreStateFn: () => void) => {
    addressBarState.pushState(this.path, restoreStateFn)
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
      this.navigateTo(state);
      this.replaceAddressBarNavigationState();
    }
    return this;
  }

  navigateToDisplayDiceKey = () => this.navigateToSubViewAndReplaceState(this.displayDiceKeyViewState);
  navigateToBackup = () => this.navigateToSubViewAndReplaceState(this.backupViewState);
  navigateToSeedHardwareKey = () => this.navigateToSubViewAndReplaceState(this.seedHardwareKeyViewState);
  navigateToDeriveSecrets = () => this.navigateToSubViewAndReplaceState(this.secretDerivationViewState);
}
