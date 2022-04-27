import { EnterDiceKeyState } from "./EnterDiceKeyState";
import { action, makeAutoObservable } from "mobx";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { PathStrings } from "../../views/Navigation/PathStrings";

export type Mode = "camera" | "manual";

export const LoadDiceKeyViewStateName = PathStrings["LoadDiceKey"];
export type LoadDiceKeyViewStateName = typeof LoadDiceKeyViewStateName;

export class LoadDiceKeyViewState implements ViewState {
  readonly viewName = LoadDiceKeyViewStateName;

  mode: Mode;
  enterDiceKeyState = new EnterDiceKeyState();

  setMode = action((mode: Mode) => {
    this.mode = mode;
  });

  navState: NavigationPathState;
  constructor(parentNavState: NavigationPathState = NavigationPathState.root, mode: Mode = "camera") {
    this.mode = mode;
    this.navState = new NavigationPathState(parentNavState, LoadDiceKeyViewStateName);
    makeAutoObservable(this);
  }
}
