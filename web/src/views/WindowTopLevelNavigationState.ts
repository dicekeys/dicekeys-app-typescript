import { action, makeObservable, override } from "mobx";
import { ViewState } from "../state/core/ViewState";
import { addressBarState } from "../state/core/AddressBarState";
import { DiceKey, DiceKeyWithKeyId } from "../dicekeys/DiceKey";
import { HasSubViews } from "../state/core";
import { DiceKeyMemoryStore, PublicDiceKeyDescriptorWithSavedOnDevice } from "../state/stores/DiceKeyMemoryStore";
import { DiceKeyState } from "../state/Window/DiceKeyState";
import { CountdownTimer } from "../utilities/CountdownTimer";
import { LoadDiceKeyViewState } from "./LoadingDiceKeys/LoadDiceKeyView";
import { AssemblyInstructionsState } from "./AssemblyInstructionsState";
import { SelectedDiceKeyViewState } from "./WithSelectedDiceKey/SelectedDiceKeyViewState";
import { fidoAccessDeniedByPlatform, SeedHardwareKeyViewState } from "./Recipes/SeedHardwareKeyViewState";
import { SeedableFIDOKeys } from "../state/hardware/usb/SeedableFIDOKeys";
import { PathStrings } from "./Navigation/PathStrings";

// export enum SubViewsOfTopLevel {
//   AppHomeView = "",
//   AssemblyInstructions = "assemble",
//   LoadDiceKeyView = "load",
//   DiceKeyView = "key",
//   SeedFidoKey = "seed"
// };

type TopLevelSubViewStates = LoadDiceKeyViewState | AssemblyInstructionsState | SelectedDiceKeyViewState | SeedHardwareKeyViewState;
type TopLevelSubViewNames = TopLevelSubViewStates["viewName"];

// type SubViews = SubViewsOfTopLevel;
// const SubViews = SubViewsOfTopLevel;

const diceKeyFromPathRoot = (pathRoot: string | undefined): DiceKeyWithKeyId | undefined => {
  if (!pathRoot) return;
  const keyId = DiceKeyMemoryStore.keyIdForCenterLetterAndDigit(pathRoot) ?? pathRoot;
  return DiceKeyMemoryStore.diceKeyForKeyId(keyId);
};


export class WindowTopLevelNavigationState extends HasSubViews<TopLevelSubViewNames, TopLevelSubViewStates> implements ViewState<"TopLevel"> {
  readonly viewName = "TopLevel";

  autoEraseCountdownTimer?: CountdownTimer | undefined;
  setAutoEraseCountdownTimer = action( (msRemaining: number= 60*1000) => {
    return this.autoEraseCountdownTimer = new CountdownTimer(msRemaining, 1000);
  })
  
  navigateToWindowHomeView = action ( () => {
    const timer = this.setAutoEraseCountdownTimer();
    this.autoEraseCountdownTimer?.onReachesZero.on( () => {
      console.log("Countdown timer reached 0");
      if (timer === this.autoEraseCountdownTimer && this.subView == null) {
        // the subview hasn't changed since the start of the countdown timer.  Erase the memory store
        console.log("Calling removeAll");
        DiceKeyMemoryStore.removeAll();
      }
    })
    // this.navigateTo(SubViews.AppHomeView);
    this.navigateTo();
  });
  navigateToAssemblyInstructions = () => this.navigateTo(new AssemblyInstructionsState());
  navigateToLoadDiceKey = () => this.navigateTo(new LoadDiceKeyViewState("camera"));
  navigateToSeedFidoKey = () => this.navigateTo(new SeedHardwareKeyViewState());

  navigateToSelectedDiceKeyView = action ( (diceKey: DiceKeyWithKeyId) => {
    this.navigateTo(new SelectedDiceKeyViewState(diceKey));
  });

  loadStoredDiceKey = async (storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice) => {
    const diceKey = await DiceKeyMemoryStore.load(storedDiceKeyDescriptor);
    if (diceKey != null) {
      this.navigateToSelectedDiceKeyView(diceKey);
    } else {
      console.log(`Could not load DiceKey from stable store`)
    }
  }

  updateAddressBar = action (() => {
    const {subView: priorSubView} = getTopLevelNavStateFromPath(addressBarState.path);
    const {diceKey, keyId} = this.foregroundDiceKeyState;
    const newPathElements: string[] = ["", this.subView];
    if (keyId != null && diceKey != null) {
      const {centerLetterAndDigit} = diceKey;
      newPathElements[1] = keyId === DiceKeyMemoryStore.keyIdForCenterLetterAndDigit(centerLetterAndDigit) ?
          centerLetterAndDigit :
          keyId;
    }
    const newPath = newPathElements.join("/");
    if (this.subView === SubViewsOfTopLevel.DiceKeyView  &&
         (priorSubView === SubViewsOfTopLevel.LoadDiceKeyView ||
          priorSubView === SubViewsOfTopLevel.AssemblyInstructions
          ) && diceKey != null && keyId != null) {
      // When displaying a DiceKey after loading/assembling, replace the load/assembly state with the display state
      addressBarState.replaceState(newPath);
    } else {
      addressBarState.pushState(newPath);
    }
  })

  constructor(_subViewState?: TopLevelSubViewStates) {
    super(_subViewState, () => this.updateAddressBar() );

    addressBarState.onPopState( (path) => {
      const newState = getTopLevelNavStateFromPath(path);
      if (newState.subView != this.subView) {
        const {subView, diceKey} = newState;
        if (subView == null || subView === SubViews.AppHomeView) {
          this.navigateToWindowHomeView();
        } else {
          this.foregroundDiceKeyState.setDiceKey(diceKey);
          this.rawSetSubView(subView);
        }
      }
    });

    makeObservable(this, {
//      subView: override,
    });
  }


  static fromPath = (path: string = window.location.pathname): WindowTopLevelNavigationState  => {
    const pathElements = path.split("/");
    const pathRoot = pathElements[1];
    switch(pathRoot) {
      case PathStrings.LoadDiceKey:
        return new WindowTopLevelNavigationState(new LoadDiceKeyViewState());
      case PathStrings.AssemblyInstructions:
        return new WindowTopLevelNavigationState(new AssemblyInstructionsState());
      // Only web uses paths, and /seed should not exist in web-only since we can't seed from browser
      // case PathStrings.SeedFidoKey:
      //   return new SeedHardwareKeyViewState();
      //  return {subView: pathRoot};
    }
    const diceKey = diceKeyFromPathRoot(pathRoot);
    if (diceKey != null) {
      // The first element in the path identifies a DiceKey, and so the rest of the path
      // is for that selected DiceKey
      return new WindowTopLevelNavigationState(SelectedDiceKeyViewState.fromPath(diceKey, pathElements.slice(2)));
    } else {
      // The state in the address bar is bogus and needs to be replaced.
      addressBarState.replaceState("/");
      return new WindowTopLevelNavigationState();
    }
  }
}