import { BackupViewState, BackupViewStateName } from "../BackupView/BackupViewState";
import { HasSubViews } from "../../state/core";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { addressBarState } from "../../state/core/AddressBarState";
import { action, makeAutoObservable } from "mobx";
import { ViewState } from "../../state/core/ViewState";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { SeedHardwareKeyViewState, SeedHardwareKeyViewStateName } from "../Recipes/SeedHardwareKeyViewState"
import { SecretDerivationViewState, SecretDerivationViewStateName } from "../../views/Recipes/DerivationView";

// export enum SelectedDiceKeySubViews {
//   DisplayDiceKey = "", // primary view
//   Backup = "backup",
//   SeedHardwareKey = "seed",
//   DeriveSecrets = "secret",
// }

export const DisplayDiceKeyViewStateName = "";
export type DisplayDiceKeyViewStateName = typeof DisplayDiceKeyViewStateName;
export class DisplayDiceKeyViewState implements ViewState<DisplayDiceKeyViewStateName> {
  readonly viewName = DisplayDiceKeyViewStateName;
  constructor(public readonly diceKey: DiceKeyWithKeyId) {}
  toPath = () => ``;
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

export class SelectedDiceKeyViewState extends HasSubViews<SelectedDiceKeySubViewStates["viewName"], SelectedDiceKeySubViewStates> implements ViewState<"SelectedDiceKey"> {
  readonly viewName = "SelectedDiceKey";

  get subViewState(): SelectedDiceKeySubViewStates {
    return this._subViewState ?? this.displayDiceKeyViewState;
  }

  _displayDiceKeyViewState?: DisplayDiceKeyViewState;
  get displayDiceKeyViewState() { return this._displayDiceKeyViewState ||= new DisplayDiceKeyViewState(this.diceKey) }
  _backupViewState?: BackupViewState;
  get backupViewState() { return this._backupViewState ||= new BackupViewState(this.diceKey) }
  _seedHardwareKeyViewState?: SeedHardwareKeyViewState;
  get seedHardwareKeyViewState() { return this._seedHardwareKeyViewState ||= new SeedHardwareKeyViewState(this.diceKey) }
  _secretDerivationViewState?: SecretDerivationViewState;
  get secretDerivationViewState() { return this._secretDerivationViewState ||= new SecretDerivationViewState(this.diceKey) }

  constructor(
    public readonly diceKey: DiceKeyWithKeyId
  ) {
    super();
  }

  toPath = () => `/${this.diceKey.centerLetterAndDigit}${this.subViewState?.toPath()}`

  /**
   * 
   * @param diceKey The DiceKey of the selected state
   * @param pathElements The elements of the address bar split by forward slashes, with the initial
   * letter and digit used to identify the DiceKey removed, such that
   * the path `/M1/a/b` would result in the `fromPathElements` array of `["a", "b"]`.
   */
  static fromPath = (diceKey: DiceKeyWithKeyId, subPathElements: string[] = []): SelectedDiceKeyViewState => {
    const instance = new SelectedDiceKeyViewState(diceKey);
    if (subPathElements.length > 0) {
      const subViewName = subPathElements[0];
      switch (subViewName) {
        case BackupViewStateName:
          return instance.rawSetSubView(instance._backupViewState = BackupViewState.fromPath(diceKey, subPathElements));
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

  navigateToSubViewAndPushState = (state: SelectedDiceKeySubViewStates) => {
    if (this.subViewState === state) return this;
    addressBarState.pushState(state.toPath(), () => {
      // On back, set the subViewState to null
      this.navigateTo();
    })
    this.navigateTo(state);
    return this;
  }

  navigateToSubViewAndReplaceState = (state: SelectedDiceKeySubViewStates) => {
    if (this.subViewState === state) return this;
    addressBarState.replaceState(state.toPath());  
    this.navigateTo(state);
    return this;
  }

  navigateToDisplayDiceKey = () => this.navigateToSubViewAndReplaceState(this.displayDiceKeyViewState);
  navigateToBackup = () => this.navigateToSubViewAndReplaceState(this.backupViewState);
  navigateToSeedHardwareKey = () => this.navigateToSubViewAndReplaceState(this.seedHardwareKeyViewState);
  navigateToDeriveSecrets = () => this.navigateToSubViewAndReplaceState(this.secretDerivationViewState);
}
