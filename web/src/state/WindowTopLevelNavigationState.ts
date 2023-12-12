import { action, makeAutoObservable } from "mobx";
import { addressBarState } from "./core/AddressBarState";
import { DiceKey, DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { SubViewState } from "./core/HasSubViews";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "./stores/DiceKeyMemoryStore";
import { CountdownTimer } from "../utilities/CountdownTimer";
import { LoadDiceKeyViewState } from "../views/LoadingDiceKeys/LoadDiceKeyViewState";
import { AssemblyInstructionsState, AssemblyInstructionsStep } from "../views/AssemblyInstructionsState";
import { SelectedDiceKeyViewState } from "../views/WithSelectedDiceKey/SelectedDiceKeyViewState";
import { SeedHardwareKeyViewState } from "../views/Recipes/SeedHardwareKeyViewState";
import { PathStrings } from "../views/Navigation/PathStrings";
import { NavigationPathState } from "./core/NavigationPathState";
import { DeleteDiceKeyViewStateName, SaveDiceKeyViewStateName, SaveOrDeleteDiceKeyStateName, SaveDiceKeyViewState, DeleteDiceKeyViewState } from "../views/SaveOrDeleteDiceKeyViewState";
import { SaveOrDeleteDiceKeyViewState } from "../views/SaveOrDeleteDiceKeyViewState";
import { RUNNING_IN_ELECTRON } from "../utilities/is-electron";
import { ObservableLocalStorageBoolean } from "../utilities/ObservableLocalStorage";
import { SecretSharingRecoveryState } from "../views/SimpleSecretSharing/SecretSharingRecoveryState";
import { DiceKeyInMemoryStoreState } from "../views/WithSelectedDiceKey/DiceKeyInMemoryStoreState";

export type TopLevelSubViewStates =
  LoadDiceKeyViewState |
  AssemblyInstructionsState |
  SelectedDiceKeyViewState |
  SeedHardwareKeyViewState |
  SaveDiceKeyViewState |
  DeleteDiceKeyViewState | 
  SecretSharingRecoveryState;

const diceKeyFromPathRoot = (pathRoot: string | undefined): DiceKeyWithKeyId | undefined => {
  if (!pathRoot) return;
  const keyId = DiceKeyMemoryStore.keyIdForCenterLetterAndDigit(pathRoot) ?? pathRoot;
  return DiceKeyMemoryStore.diceKeyForKeyId(keyId);
};

const clearDiceKeyMemoryStore = () => {
  console.log("Remove all short term keys from the DiceKeyMemoryStore");
  DiceKeyMemoryStore.removeAll();
}

const AutoEraseDisabled = new ObservableLocalStorageBoolean("autoEraseDisabled", false);

export class WindowTopLevelNavigationState {
  readonly autoEraseCountdownTimer = new CountdownTimer({
    name: `autoEraseCountdownTimer`,
    callbackOnReachesZero: () => {
      if (!this.autoEraseDisabled) {
        clearDiceKeyMemoryStore();
      }
  }});

  setAutoEraseCountdownTimer = action( (startAtMs: number= 60*1000) => {
    this.autoEraseCountdownTimer.start({startAtMs});
  });
  
  navigateDownTo = (subViewState: TopLevelSubViewStates) => this.subView.navigateToPushState(subViewState);

  navigateToAssemblyInstructions = () => {
    const assemblyInstructionsState = new AssemblyInstructionsState(this.navState, () => {this.subView.rawSetSubView(assemblyInstructionsState)}, {...this.selectedDiceKeyState.getSetDiceKey});
    this.navigateDownTo(assemblyInstructionsState);
  }
  navigateToLoadDiceKey = () => this.navigateDownTo(new LoadDiceKeyViewState(this.navState, "camera"));
  navigateToSeedFidoKey = () => this.navigateDownTo(new SeedHardwareKeyViewState(this.navState, {
    getDiceKey: this.selectedDiceKeyState.getDiceKey, setDiceKey: this.selectedDiceKeyState.setDiceKey
  }));

  navigateToRecoverFromShares = () => this.navigateDownTo(new SecretSharingRecoveryState(this.navState, {}));

  navigateToSaveOrDeleteFromDevice = (saveOrDelete: SaveOrDeleteDiceKeyStateName) => async (descriptor: PublicDiceKeyDescriptorWithSavedOnDevice) => {
    const diceKey = await DiceKeyMemoryStore.load(descriptor);
    if (diceKey) {
      this.navigateDownTo(new SaveOrDeleteDiceKeyViewState(saveOrDelete, this.navState,
        () => DiceKeyMemoryStore.diceKeyForKeyId(descriptor.keyId)
      ));
    }
  }
  navigateToDeleteFromDevice = this.navigateToSaveOrDeleteFromDevice(DeleteDiceKeyViewStateName);
  navigateToSaveToDevice = this.navigateToSaveOrDeleteFromDevice(SaveDiceKeyViewStateName);

  navigateToSelectedDiceKeyView = action ( (diceKey: DiceKey) => {
    this.selectedDiceKeyState.setDiceKey(diceKey);
    this.subView.navigateToPushState(new SelectedDiceKeyViewState(this.navState, this.selectedDiceKeyState));
  });

  navigateToReplaceSelectedDiceKeyView = async (diceKey: DiceKey) => {
    await this.selectedDiceKeyState.setDiceKey(diceKey);
    this.subView.navigateToReplaceState(new SelectedDiceKeyViewState(this.navState, this.selectedDiceKeyState));
  };

  onReturnFromActionThatMayLoadDiceKey = async (diceKey: DiceKey | undefined) => {
    if (diceKey != null) {
      this.navigateToReplaceSelectedDiceKeyView(diceKey);

      // this.selectedDiceKeyState.setDiceKey(diceKey);
      // if (addressBarState.historyIndex <= 0) {
      //   // We're at least one deep into the history stack, which means AssemblyInstructions was launched from the main screen
      //   // and should be replaced with the SelectedDiceKey screen
      //   this.subView.navigateToReplaceState(new SelectedDiceKeyViewState(this.navState, this.selectedDiceKeyState));
      // } else {
      //   // Navigate to the top screen, then down to the selected DiceKey view
      //   this.subView.navigateToReplaceState(undefined);
      //   this.navigateToReplaceSelectedDiceKeyView(diceKey);
      // }
    } else {
      addressBarState.back();
    }
  }

  loadStoredDiceKey = async (storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice) => {
    const diceKey = await DiceKeyMemoryStore.load(storedDiceKeyDescriptor);
    if (diceKey != null) {
      this.navigateToSelectedDiceKeyView(diceKey);
    } else {
      console.log(`Could not load DiceKey from stable store`)
    }
  }

  get autoEraseDisabled() { return AutoEraseDisabled.value }
  private setAutoEraseDisabled = (trueToDisable: boolean) => action( ()  => {
    if (this.autoEraseDisabled !== trueToDisable) {
      AutoEraseDisabled.setValue(trueToDisable);
      this.startOrStopTimerIfNecessary();
    }
  });
  enableAutoErase = this.setAutoEraseDisabled(false);
  disableAutoErase = this.setAutoEraseDisabled(true);


  startOrStopTimerIfNecessary = () => {
    if (this.subView.subViewState == null && DiceKeyMemoryStore.keysOnlyInMemory.length > 0 && !this.autoEraseDisabled) {
      // We're showing the primary view, there's a key only in temporary memory, and should we should start the timer.
      this.autoEraseCountdownTimer.start();
    } else {
      // We're showing a different view and should clear the timer.
      this.autoEraseCountdownTimer.clear();
    }
  }




  readonly navState: NavigationPathState = new NavigationPathState("", "", () => {
    return this.subView.subViewState?.navState.fromHereToEndOfPathInclusive ?? "";
  });
  selectedDiceKeyState = new DiceKeyInMemoryStoreState();
  subView: SubViewState<TopLevelSubViewStates>;

  constructor(defaultSubView?: TopLevelSubViewStates) {
    this.navState = new NavigationPathState("", "", () => {
      return this.subView.subViewState?.navState.fromHereToEndOfPathInclusive ?? "";
    });
    this.subView = new SubViewState<TopLevelSubViewStates>("ROOT", this.navState, defaultSubView);
    this.startOrStopTimerIfNecessary();
    this.subView.subStateChangedEvent.on( this.startOrStopTimerIfNecessary );
    AutoEraseDisabled.changed.on( this.startOrStopTimerIfNecessary );

    makeAutoObservable(this);
  }

  static fromPath = (path: string = window.location.pathname): WindowTopLevelNavigationState  => {
    const pathElements = path.split("/");
    const pathRoot = pathElements[1];
    const windowTopLevelNavigationState = new WindowTopLevelNavigationState();
    switch(pathRoot) {
      case PathStrings.LoadDiceKey:
        window.history.replaceState({depth: 0}, "", "");
        windowTopLevelNavigationState.subView.navigateToPushState(new LoadDiceKeyViewState(windowTopLevelNavigationState.navState, "camera"));
        return windowTopLevelNavigationState;
      case PathStrings.AssemblyInstructions:
        window.history.replaceState({depth: 0}, "", "");
        // Get step number from path
        const stepNumber = parseInt(pathElements[2] ?? "0");
        // Can't jump past the scan step on refresh as there will be no key scanned.
        const maxStep = AssemblyInstructionsStep.ScanFirstTime;
        const step = isNaN(stepNumber) ? AssemblyInstructionsStep.START_INCLUSIVE :
          Math.min(Math.max(stepNumber, AssemblyInstructionsStep.START_INCLUSIVE), maxStep);
        windowTopLevelNavigationState.subView.navigateToPushState(new AssemblyInstructionsState(windowTopLevelNavigationState.navState, () => {}, {step, ...windowTopLevelNavigationState.selectedDiceKeyState.getSetDiceKey}));
        return windowTopLevelNavigationState;
      // Only web uses paths, and /seed should not exist in web-only since we can't seed from browser
      // case PathStrings.SeedFidoKey:
      //   return new SeedHardwareKeyViewState();
      //  return {subView: pathRoot};
      default:
    }
    const diceKey = diceKeyFromPathRoot(pathRoot);
    if (diceKey != null) {
      // The first element in the path identifies a DiceKey, and so the rest of the path
      // is for that selected DiceKey
      windowTopLevelNavigationState.selectedDiceKeyState.setDiceKey(diceKey);
      windowTopLevelNavigationState.subView.navigateToPushState(SelectedDiceKeyViewState.fromPath(windowTopLevelNavigationState.navState, windowTopLevelNavigationState.selectedDiceKeyState, pathElements.slice(2)));
    } else {
      // The state in the address bar is bogus and needs to be replaced.
      if (path !== "" && path !== "/") {
        window.history.replaceState({}, "", "/");
      }      
      // addressBarState.setInitialState("/", () => {
      //   windowTopLevelNavigationState.subView.rawSetSubView(undefined);
      //   windowTopLevelNavigationState.onRestoreTopLevelState();
      // })
    }
    return windowTopLevelNavigationState;
  }
}

export const createTopLevelNavigationState = () => {
  return RUNNING_IN_ELECTRON ?
    new WindowTopLevelNavigationState() : WindowTopLevelNavigationState.fromPath()
}