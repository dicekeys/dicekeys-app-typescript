import { action, computed, makeObservable, observable } from "mobx";
import { addressBarState } from "./AddressBarState";
import { NavigationPathState, ViewState } from "./ViewState";

export class SubViewState<VIEW_STATE extends ViewState> {
  protected _subViewState: VIEW_STATE | undefined;
  get subViewState() { return this._subViewState; }
  rawSetSubView = action( (destinationSubView?: VIEW_STATE) => {
    this._subViewState = destinationSubView;
    return this;
  });

  /***
   * Navigate to a subview
   */
  navigateToPushState = (destinationSubViewState: VIEW_STATE, onRestoreState?: () => void) => {
    const previousSubViewState = this.subViewState;
    if (destinationSubViewState != previousSubViewState) {
      const doStateChange = () => {
        this.rawSetSubView(destinationSubViewState);
      };
      const undoStateChange = () => {
        this.rawSetSubView(previousSubViewState);
        onRestoreState?.();
      }
      addressBarState.pushState(this.navState.getPath, doStateChange, undoStateChange);
    }
  };

  navigateToReplaceState = (
    pathStrOrFn: string | (() => string) | undefined = undefined,
    destinationSubViewState: VIEW_STATE | undefined = undefined
  ) => {
    const doStateChange = () => {
      this.rawSetSubView(destinationSubViewState);
    };
    addressBarState.replaceState(pathStrOrFn ?? this.navState.getPath, doStateChange);
  };

  constructor(readonly navState: NavigationPathState, defaultSubView?: VIEW_STATE) {
    this._subViewState = defaultSubView;
    makeObservable<SubViewState<VIEW_STATE>, "_subViewState">(this, {      
      "_subViewState": observable,
      subViewState: computed,
//      subViewName: computed,
    })
  }
}
