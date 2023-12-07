import { DiceKey } from "../dicekeys/DiceKey";
import { ViewState } from "../state/core/ViewState";
import { NavigationPathState } from "../state/core/NavigationPathState";

export const SaveDiceKeyViewStateName = "save";
export const DeleteDiceKeyViewStateName = "delete";
export type SaveDiceKeyViewStateName = typeof SaveDiceKeyViewStateName;
export type DeleteDiceKeyViewStateName = typeof DeleteDiceKeyViewStateName;
export type SaveOrDeleteDiceKeyStateName = SaveDiceKeyViewStateName | DeleteDiceKeyViewStateName;

export class SaveOrDeleteDiceKeyViewState<SAVE_OR_DELETE extends SaveOrDeleteDiceKeyStateName = SaveOrDeleteDiceKeyStateName> implements ViewState {
  readonly navState: NavigationPathState;

  constructor(
    public readonly viewName: SAVE_OR_DELETE,
    parentNavState: NavigationPathState,
    public readonly getDiceKey: () => DiceKey | undefined,
    localPath: string | (() => string) = `${viewName}/${ getDiceKey()?.centerLetterAndDigit}`
  ) {
    this.navState = new NavigationPathState(parentNavState, localPath);
  }
}
export type SaveDiceKeyViewState = SaveOrDeleteDiceKeyViewState<SaveDiceKeyViewStateName>;
export type DeleteDiceKeyViewState = SaveOrDeleteDiceKeyViewState<DeleteDiceKeyViewStateName>;

