import { action, makeObservable } from "mobx";
import { addressBarState } from "../state/core/AddressBarState";
import { DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { SubViewState } from "../state/core";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "../state/stores/DiceKeyMemoryStore";
import { CountdownTimer } from "../utilities/CountdownTimer";
import { LoadDiceKeyViewState } from "./LoadingDiceKeys/LoadDiceKeyView";
import { AssemblyInstructionsState } from "./AssemblyInstructionsState";
import { SelectedDiceKeyViewState } from "./WithSelectedDiceKey/SelectedDiceKeyViewState";
import { SeedHardwareKeyViewState } from "./Recipes/SeedHardwareKeyViewState";
import { PathStrings } from "./Navigation/PathStrings";
import { NavState } from "../state/core/ViewState";

type TopLevelSubViewStates = LoadDiceKeyViewState | AssemblyInstructionsState | SelectedDiceKeyViewState | SeedHardwareKeyViewState;

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
  navigateToAssemblyInstructions = () => this.navigateDownTo(new AssemblyInstructionsState(this.navState));
  navigateToLoadDiceKey = () => this.navigateDownTo(new LoadDiceKeyViewState(this.navState, "camera"));
  navigateToSeedFidoKey = () => this.navigateDownTo(new SeedHardwareKeyViewState(this.navState));

  navigateToSelectedDiceKeyView = action ( (diceKey: DiceKeyWithKeyId) => {
    this.subView.navigateToPushState(new SelectedDiceKeyViewState(this.navState, diceKey), this.onRestoreTopLevelState);
  });

  loadScannedOrEnteredDiceKey = (diceKey: DiceKeyWithKeyId) => {
    const diceKeyWithCenterFaceUpright =  DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey);
    this.subView.navigateToReplaceState(new SelectedDiceKeyViewState(this.navState, diceKeyWithCenterFaceUpright));
  }

  onReturnFromAssemblyInstructions = (diceKey?: DiceKeyWithKeyId) => {
    if (diceKey) {    
      const diceKeyWithCenterFaceUpright = DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey);
      this.subView.navigateToReplaceState(new SelectedDiceKeyViewState(this.navState, diceKeyWithCenterFaceUpright));
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

  navState: NavState;
  subView: SubViewState<TopLevelSubViewStates>;
  constructor(defaultSubView?: TopLevelSubViewStates, navState: NavState = NavState.root) {
    this.navState = navState;
    this.subView = new SubViewState<TopLevelSubViewStates>(navState, defaultSubView);
    this.onRestoreTopLevelState();
    // addressBarState.onPopState( (path) => {
    //   const newState = getTopLevelNavStateFromPath(path);
    //   if (newState.subView != this.subView) {
    //     const {subView, diceKey} = newState;
    //     if (subView == null || subView === SubViews.AppHomeView) {
    //       this.subView.navigateToWindowHomeView();
    //     } else {
    //       this.foregroundDiceKeyState.setDiceKey(diceKey);
    //       this.rawSetSubView(subView);
    //     }
    //   }
    // });

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
        windowTopLevelNavigationState.subView.navigateToPushState(new LoadDiceKeyViewState(windowTopLevelNavigationState.navState, "camera"));
        return windowTopLevelNavigationState;
      case PathStrings.AssemblyInstructions:
        // FIXME -- get step number from path
        window.history.replaceState({depth: 0}, "", "");
        windowTopLevelNavigationState.subView.navigateToPushState(new AssemblyInstructionsState(windowTopLevelNavigationState.navState));
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
      addressBarState.replaceState("/");
    }
    return windowTopLevelNavigationState;
  }
}