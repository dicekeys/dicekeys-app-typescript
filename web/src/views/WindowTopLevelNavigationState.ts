import { action, makeObservable } from "mobx";
import { addressBarState } from "../state/core/AddressBarState";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { SubViewState } from "../state/core";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "../state/stores/DiceKeyMemoryStore";
import { CountdownTimer } from "../utilities/CountdownTimer";
import { LoadDiceKeyViewState } from "./LoadingDiceKeys/LoadDiceKeyView";
import { AssemblyInstructionsState, AssemblyInstructionsStep } from "./AssemblyInstructionsState";
import { SelectedDiceKeyViewState } from "./WithSelectedDiceKey/SelectedDiceKeyViewState";
import { SeedHardwareKeyViewState } from "./Recipes/SeedHardwareKeyViewState";
import { PathStrings } from "./Navigation/PathStrings";
import { NavigationPathState } from "../state/core/ViewState";
import { DeleteDiceKeyStateName, SaveDiceKeyStateName, SaveOrDeleteDiceKeyState, SaveOrDeleteDiceKeyStateName } from "./SaveDiceKeyView";

export type TopLevelSubViewStates =
  LoadDiceKeyViewState |
  AssemblyInstructionsState |
  SelectedDiceKeyViewState |
  SeedHardwareKeyViewState |
  SaveOrDeleteDiceKeyState

const diceKeyFromPathRoot = (pathRoot: string | undefined): DiceKeyWithKeyId | undefined => {
  if (!pathRoot) return;
  const keyId = DiceKeyMemoryStore.keyIdForCenterLetterAndDigit(pathRoot) ?? pathRoot;
  return DiceKeyMemoryStore.diceKeyForKeyId(keyId);
};

export class WindowTopLevelNavigationState {

  autoEraseCountdownTimer?: CountdownTimer | undefined;
  setAutoEraseCountdownTimer = action( (msRemaining: number= 60*1000) => {
    return this.autoEraseCountdownTimer = new CountdownTimer(msRemaining, 1000);
  });
  clearAutoEraseCountdownTimer = action( () => {
    return this.autoEraseCountdownTimer = undefined;
  });

  onRestoreTopLevelState = action ( () => {
    const timer = this.setAutoEraseCountdownTimer();
    this.autoEraseCountdownTimer?.onReachesZero.on( () => {
      console.log("Countdown timer reached 0");
      if (timer === this.autoEraseCountdownTimer && this.subView.subViewState == null) {
        // the subview hasn't changed since the start of the countdown timer.  Erase the memory store
        console.log("Calling removeAll");
        DiceKeyMemoryStore.removeAll();
      }
    });
  });
  
  // navigateToWindowHomeView = action ( () => {
  //   const timer = this.setAutoEraseCountdownTimer();
  //   this.autoEraseCountdownTimer?.onReachesZero.on( () => {
  //     console.log("Countdown timer reached 0");
  //     if (timer === this.autoEraseCountdownTimer && this.subView == null) {
  //       // the subview hasn't changed since the start of the countdown timer.  Erase the memory store
  //       console.log("Calling removeAll");
  //       DiceKeyMemoryStore.removeAll();
  //     }
  //   })
  //   // this.subView.navigateTo(SubViews.AppHomeView);
  //   this.subView.navigateTo();
  // });

  navigateDownTo = (subViewState: TopLevelSubViewStates) => {
    // const back = () => {
    //   this.subView.rawSetSubView(undefined);
    //   this.onRestoreTopLevelState();
    // }
    this.subView.navigateToPushState(subViewState, this.onRestoreTopLevelState);
  }
  navigateToAssemblyInstructions = () => {
    const assemblyInstructionsState = new AssemblyInstructionsState(this.navState, () => {this.subView.rawSetSubView(assemblyInstructionsState)});
    this.navigateDownTo(assemblyInstructionsState);
  }
  navigateToLoadDiceKey = () => this.navigateDownTo(new LoadDiceKeyViewState(this.navState, "camera"));
  navigateToSeedFidoKey = () => this.navigateDownTo(new SeedHardwareKeyViewState(this.navState));

  navigateToSaveOrDeleteFromDevice = (saveOrDelete: SaveOrDeleteDiceKeyStateName) => async (descriptor: PublicDiceKeyDescriptorWithSavedOnDevice) => {
    const diceKey = await DiceKeyMemoryStore.load(descriptor);
    if (diceKey) {
      this.navigateDownTo(new SaveOrDeleteDiceKeyState(saveOrDelete, this.navState, diceKey));
    }
  }
  navigateToDeleteFromDevice = this.navigateToSaveOrDeleteFromDevice(DeleteDiceKeyStateName);
  navigateToSaveToDevice = this.navigateToSaveOrDeleteFromDevice(SaveDiceKeyStateName);

  navigateToSelectedDiceKeyView = action ( (diceKey: DiceKeyWithKeyId) => {
    this.subView.navigateToPushState(new SelectedDiceKeyViewState(this.navState, diceKey), this.onRestoreTopLevelState);
  });

  onReturnFromActionThatMayLoadDiceKey = (diceKey?: DiceKeyWithKeyId) => {
    if (diceKey) {    
      const diceKeyWithCenterFaceUpright = DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey);
      if (addressBarState.historyIndex > 0) {
        // We're at least one deep into the history stack, which means AssemblyInstructions was launched from the main screen
        // and should be replaced with the SelectedDiceKey screen
        this.subView.navigateToReplaceState(undefined, new SelectedDiceKeyViewState(this.navState, diceKeyWithCenterFaceUpright));
      } else {
        // Navigate to the top screen, then down to the selected DiceKey view
        this.subView.navigateToReplaceState("");
        setTimeout( () => {
          this.subView.navigateToPushState(new SelectedDiceKeyViewState(this.navState, diceKeyWithCenterFaceUpright), this.onRestoreTopLevelState);
        }, 1000);
      }
    } else {
      addressBarState.back();
    }
  }

  loadStoredDiceKey = async (storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice) => {
    const diceKey = await DiceKeyMemoryStore.load(storedDiceKeyDescriptor);
    if (diceKey != null) {
      this.subView.navigateToPushState(new SelectedDiceKeyViewState(this.navState, diceKey), this.onRestoreTopLevelState);
    } else {
      console.log(`Could not load DiceKey from stable store`)
    }
  }

  // updateAddressBar = action (() => {
  //   const {subView: priorSubView} = getTopLevelNavStateFromPath(addressBarState.path);
  //   const {diceKey, keyId} = this.foregroundDiceKeyState;
  //   const newPathElements: string[] = ["", this.subView];
  //   if (keyId != null && diceKey != null) {
  //     const {centerLetterAndDigit} = diceKey;
  //     newPathElements[1] = keyId === DiceKeyMemoryStore.keyIdForCenterLetterAndDigit(centerLetterAndDigit) ?
  //         centerLetterAndDigit :
  //         keyId;
  //   }
  //   const newPath = newPathElements.join("/");
  //   if (this.subView === SubViewsOfTopLevel.DiceKeyView  &&
  //        (priorSubView === SubViewsOfTopLevel.LoadDiceKeyView ||
  //         priorSubView === SubViewsOfTopLevel.AssemblyInstructions
  //         ) && diceKey != null && keyId != null) {
  //     // When displaying a DiceKey after loading/assembling, replace the load/assembly state with the display state
  //     addressBarState.replaceState(newPath);
  //   } else {
  //     addressBarState.pushState(newPath);
  //   }
  // })

  navState: NavigationPathState;
  subView: SubViewState<TopLevelSubViewStates>;
  constructor(defaultSubView?: TopLevelSubViewStates) {
    this.navState = new NavigationPathState("", "", () => {
      return this.subView.subViewState?.navState.fromHereToEndOfPathInclusive ?? "";
    });
    this.subView = new SubViewState<TopLevelSubViewStates>(this.navState, defaultSubView);

    makeObservable(this, {
//      subView: override,
    });
  }


  static fromPath = (path: string = window.location.pathname): WindowTopLevelNavigationState  => {
    const pathElements = path.split("/");
    const pathRoot = pathElements[1];
    const windowTopLevelNavigationState = new WindowTopLevelNavigationState();
    switch(pathRoot) {
      case PathStrings.LoadDiceKey:
        window.history.replaceState({depth: 0}, "", "");
        windowTopLevelNavigationState.subView.navigateToPushState(new LoadDiceKeyViewState(windowTopLevelNavigationState.navState, "camera"), windowTopLevelNavigationState.onRestoreTopLevelState);
        return windowTopLevelNavigationState;
      case PathStrings.AssemblyInstructions:
        // FIXME -- get step number from path
        window.history.replaceState({depth: 0}, "", "");
        const stepNumber = parseInt(pathElements[2] ?? "0");
        // Can't jump past the scan step on refresh as there will be no key scanned.
        const maxStep = AssemblyInstructionsStep.ScanFirstTime;
        const step = isNaN(stepNumber) ? AssemblyInstructionsStep.START_INCLUSIVE :
          Math.min(Math.max(stepNumber, AssemblyInstructionsStep.START_INCLUSIVE), maxStep);
        windowTopLevelNavigationState.subView.navigateToPushState(new AssemblyInstructionsState(windowTopLevelNavigationState.navState, () => {}, step), windowTopLevelNavigationState.onRestoreTopLevelState);
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
      windowTopLevelNavigationState.subView.navigateToPushState(SelectedDiceKeyViewState.fromPath(windowTopLevelNavigationState.navState, diceKey, pathElements.slice(2)));
    } else {
      // The state in the address bar is bogus and needs to be replaced.
      if (path !== "" && path !== "/") {
        window.history.replaceState({}, "", "/");
      }      
      addressBarState.setInitialState("/", () => {
        windowTopLevelNavigationState.subView.rawSetSubView(undefined);
        windowTopLevelNavigationState.onRestoreTopLevelState();
      })
    }
    return windowTopLevelNavigationState;
  }
}