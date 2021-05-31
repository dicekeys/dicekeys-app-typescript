import { action, makeObservable, override, runInAction } from "mobx";
import { DiceKey } from "../dicekeys/DiceKey";
import { HasSubViews } from "../state/core";
import { DiceKeyMemoryStore } from "../state/stores/DiceKeyMemoryStore";
import { DiceKeyState } from "../state/Window/DiceKeyState";

export enum SubViewsOfTopLevel {
  AppHomeView = "",
  AssemblyInstructions = "assemble",
  LoadDiceKeyView = "load",
  DiceKeyView = "key",
};

type SubViews = SubViewsOfTopLevel;
const SubViews = SubViewsOfTopLevel;

const getDiceKeyFromPathRoot = (pathRoot: string | undefined): DiceKey | undefined => {
  if (!pathRoot) return;
  return DiceKeyMemoryStore.diceKeyForKeyId(
    DiceKeyMemoryStore.keyIdForCenterLetterAndDigit((pathRoot)) ?? pathRoot
  );
};

const getTopLevelNavStateFromPath = (path: string = window.location.pathname) => {
  const pathRoot = path.split("/")[1];
  let diceKey: DiceKey | undefined;
  let subView: SubViewsOfTopLevel | undefined;
  switch(pathRoot) {
    case SubViewsOfTopLevel.AppHomeView:
    case SubViewsOfTopLevel.AssemblyInstructions:
    case SubViewsOfTopLevel.LoadDiceKeyView:
      subView = pathRoot;
      break;
    default:
      diceKey = getDiceKeyFromPathRoot(pathRoot);
      if (diceKey != null) {
        subView = SubViewsOfTopLevel.DiceKeyView;
      }
  }
  return {subView, diceKey}
}

export class WindowTopLevelNavigationState extends HasSubViews<SubViews> {
  foregroundDiceKeyState: DiceKeyState;
  navigateToWindowHomeView = action ( () => {
    this.foregroundDiceKeyState.clear();
    this.navigateTo(SubViews.AppHomeView);
  });
  navigateToAssemblyInstructions = this.navigateToSubView(SubViews.AssemblyInstructions)
  navigateToLoadDiceKey = this.navigateToSubView(SubViews.LoadDiceKeyView)

  private navigateToSelectedDiceKeyViewForKeyId = action ( (keyId: string) => {
    this.foregroundDiceKeyState.setKeyId(keyId);
    this.navigateTo(SubViews.DiceKeyView);
  });

  navigateToSelectedDiceKeyView = async (diceKey: DiceKey) => {
    const keyId = await diceKey.keyId();
    runInAction( () => {
      DiceKeyMemoryStore.addDiceKeyForKeyId(keyId, diceKey);
      this.navigateToSelectedDiceKeyViewForKeyId(keyId);
    });
  }

  get subView(): SubViews {
    switch(this._subView) {
      case SubViews.DiceKeyView:
        return (this.foregroundDiceKeyState.diceKey != null) ? this._subView : SubViews.AppHomeView
      default:
        return this._subView
    }
  }

  updateAddressBar = () => {
    const {diceKey, keyId} = this.foregroundDiceKeyState;
    if (this.subView === SubViewsOfTopLevel.DiceKeyView && diceKey != null && keyId != null) {
      const {centerLetterAndDigit} = diceKey;
      if (keyId === DiceKeyMemoryStore.keyIdForCenterLetterAndDigit(centerLetterAndDigit)) {
        // the center die's letter and digit uniquely identify this DiceKey among all those in memory
        window.history.replaceState({}, "", `/${centerLetterAndDigit}`)
      } else {
        window.history.replaceState({}, "", `/${keyId}`)
      }
      return;
    } else {
      window.history.pushState({}, "", `/${this.subView}`);
    }
  }

  constructor({
      subView = SubViews.AppHomeView,
      diceKey
    }: Partial<ReturnType<typeof getTopLevelNavStateFromPath>> = getTopLevelNavStateFromPath()
  ) {
    super(subView, () => this.updateAddressBar() );
    this.foregroundDiceKeyState = new DiceKeyState(diceKey);

    window.addEventListener('popstate', (_: PopStateEvent) => {
      const newState = getTopLevelNavStateFromPath();
      runInAction(() => {
        this.rawSetSubView(newState.subView ?? SubViews.AppHomeView);
        this.foregroundDiceKeyState.setDiceKey(diceKey);
      });
    });

    makeObservable(this, {
      subView: override,
    });
  }
}