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


const getDiceKeyFromPathRoot = (pathRoot: string | undefined) => {
  if (!pathRoot) return;
  const keyId = DiceKeyMemoryStore.keyIdForCenterLetterAndDigit((pathRoot)) ?? pathRoot;
  const diceKey = DiceKeyMemoryStore.diceKeyForKeyId(keyId);
  return {keyId, diceKey}
};

const getTopLevelNavStateFromPath = (path: string):
  {subViewState?: TopLevelSubViewStates, keyId?: string, diceKey?: DiceKey}  => {
  const pathRoot = path.split("/")[1];
  switch(pathRoot) {
    case PathStrings.LoadDiceKey:
      return new WindowTopLevelNavigationState(new LoadDiceKeyViewState());
    case PathStrings.AssemblyInstructions:
      return new WindowTopLevelNavigationState(new AssemblyInstructionsState());
    // Only web uses paths, and /seed should not exist in web-only since we can't seed from browser
    // case PathStrings.SeedFidoKey:
    //   return new SeedHardwareKeyViewState();
    //  return {subView: pathRoot};
    default:
      const {diceKey, keyId} = getDiceKeyFromPathRoot(pathRoot) ?? {};
      if (diceKey != null && keyId != null) {
        return {subView: SubViewsOfTopLevel.DiceKeyView, diceKey, keyId} as const;
      } else {
        // The state in the address bar is bogus and needs to be replaced.
        addressBarState.replaceState("/");
        return new WindowTopLevelNavigationState();
      }
  }
  return {subView: undefined}
}

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
  navigateToAssemblyInstructions = () => this.navigateTo(new AssemblyInstructionsState(this.foregroundDiceKeyState));
  navigateToLoadDiceKey = () => this.navigateTo(new LoadDiceKeyViewState("camera"));
  navigateToSeedFidoKey = () => this.navigateTo(new SeedHardwareKeyViewState(fidoAccessDeniedByPlatform ? undefined : new SeedableFIDOKeys(), this.foregroundDiceKeyState));

  navigateToSelectedDiceKeyView = action ( (diceKey: DiceKeyWithKeyId) => {
    this.navigateToSelectedDiceKeyView(new SelectedDiceKeyViewState(diceKey));
  });

  loadStoredDiceKey = async (storedDiceKeyDescriptor: PublicDiceKeyDescriptorWithSavedOnDevice) => {
    const diceKey = await DiceKeyMemoryStore.load(storedDiceKeyDescriptor);
    if (diceKey != null) {
      this.navigateToSelectedDiceKeyView(diceKey);
    } else {
      console.log(`Could not load DiceKey from stable store`)
    }
  }

  get subView(): SubViews {
    switch(this._subView) {
      case SubViews.DiceKeyView:
        return (this.foregroundDiceKeyState.diceKey != null) ? this._subView : SubViews.AppHomeView
      default:
        return this._subView
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
}