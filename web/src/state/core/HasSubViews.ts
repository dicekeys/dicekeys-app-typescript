import { action, computed, makeObservable, observable } from "mobx";
import { NavState, ViewState } from "./ViewState";

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
      const restorePreviousSubViewState = () => {
        this.rawSetSubView(previousSubViewState);
        onRestoreState?.();
      }
      this.rawSetSubView(destinationSubViewState);
      (this.subViewState?.navState ?? this.navState).pushAddressBarNavigationState( restorePreviousSubViewState );
    }
  };

  navigateToReplaceState = (destinationSubViewState?: VIEW_STATE) => {
    const previousSubViewState = this.subViewState;
    if (destinationSubViewState != previousSubViewState) {
      this.rawSetSubView(destinationSubViewState);
      (this.subViewState?.navState ?? this.navState).replaceAddressBarNavigationState( );
    }
  };

  constructor(readonly navState: NavState, defaultSubView?: VIEW_STATE) {
    this._subViewState = defaultSubView;
    makeObservable<SubViewState<VIEW_STATE>, "_subViewState">(this, {      
      "_subViewState": observable,
      subViewState: computed,
//      subViewName: computed,
    })
  }
}
