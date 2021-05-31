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

const getDiceKeyFromPathRoot = (pathRoot: string | undefined) => {
  if (!pathRoot) return;
  const keyId = DiceKeyMemoryStore.keyIdForCenterLetterAndDigit((pathRoot)) ?? pathRoot;
  const diceKey = DiceKeyMemoryStore.diceKeyForKeyId(keyId);
  return {keyId, diceKey}
};

const getTopLevelNavStateFromPath = (path: string = window.location.pathname): (
  {subView?: SubViewsOfTopLevel, keyId?: string, diceKey?: DiceKey}
) => {
  const pathRoot = path.split("/")[1];
  switch(pathRoot) {
    case SubViewsOfTopLevel.AppHomeView:
    case SubViewsOfTopLevel.AssemblyInstructions:
    case SubViewsOfTopLevel.LoadDiceKeyView:
      return {subView: pathRoot};
    default:
      const {diceKey, keyId} = getDiceKeyFromPathRoot(pathRoot) ?? {};
      if (diceKey != null && keyId != null) {
        return {subView: SubViewsOfTopLevel.DiceKeyView, diceKey, keyId} as const;
      }
  }
  return {subView: undefined}
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

  updateAddressBar = action (() => {
    const {subView: priorSubView} = getTopLevelNavStateFromPath();
    const {diceKey, keyId} = this.foregroundDiceKeyState;
    const newPathElements: string[] = ["", this.subView];
    if (keyId != null && diceKey != null) {
      const {centerLetterAndDigit} = diceKey;
      newPathElements.push( keyId === DiceKeyMemoryStore.keyIdForCenterLetterAndDigit(centerLetterAndDigit) ?
          centerLetterAndDigit :
          keyId
      );
    }
    const newPath = newPathElements.join("/");
    const stateArgs = [{}, "", newPath] as const;
    if (this.subView === SubViewsOfTopLevel.DiceKeyView  &&
         (priorSubView === SubViewsOfTopLevel.LoadDiceKeyView ||
          priorSubView === SubViewsOfTopLevel.AssemblyInstructions
          ) && diceKey != null && keyId != null) {
      // When displaying a DiceKey after loading/assembling, replace the load/assembly state with the display state
      window.history.replaceState(...stateArgs);
    } else {
      window.history.pushState(...stateArgs);
    }
  })

  constructor({
      subView = SubViews.AppHomeView,
      diceKey,
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