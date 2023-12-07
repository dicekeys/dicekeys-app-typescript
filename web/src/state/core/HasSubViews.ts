import { action, computed, makeObservable, observable } from "mobx";
import { addressBarState } from "./AddressBarState";
import { ViewState } from "./ViewState";
import { NavigationPathState } from "./NavigationPathState";

import {CustomEvent} from "../../utilities/event";

export class SubViewState<VIEW_STATE extends ViewState> {
  protected _subViewState: VIEW_STATE | undefined;
  readonly subStateChangedEvent = new CustomEvent<[VIEW_STATE | undefined, VIEW_STATE | undefined], this>(this);

  get subViewState() { return this._subViewState; }
  rawSetSubView = action( (destinationSubViewState?: VIEW_STATE) => {
    const previousSubViewState = this._subViewState;
    // console.log(`Setting subview of ${this.name} from ${previousSubViewState?.viewName ?? "undefined"} to ${destinationSubViewState?.viewName ?? "undefined"}`)
    if (destinationSubViewState !== previousSubViewState) {
      this._subViewState = destinationSubViewState;
      this.subStateChangedEvent.sendEventually(previousSubViewState, destinationSubViewState);
    }
    return this;
  });

  clear = () => this.rawSetSubView(undefined);

  /***
   * Navigate to a subview supporting back to get back to the current subview
   */
  navigateToPushState = (destinationSubViewState: VIEW_STATE) => {
    const previousSubViewState = this.subViewState;
    if (destinationSubViewState !== previousSubViewState) {
      const doStateChange = () => {
        this.rawSetSubView(destinationSubViewState);
      };
      const undoStateChange = () => {
        this.rawSetSubView(previousSubViewState);
      }
      addressBarState.pushState(this.navState.getPath, doStateChange, undoStateChange);
    }
  };

  /***
   * Navigate to a subview, but with back going to wherever we came
   * from this subview.
   */
   navigateToReplaceState = (
    destinationSubViewState: VIEW_STATE | undefined = undefined
  ) => {
    const doStateChange = () => {
      this.rawSetSubView(destinationSubViewState);
    };
    addressBarState.replaceState(this.navState.getPath, doStateChange);
  };

  constructor(public readonly name: string, public navState: NavigationPathState, initialSubView?: VIEW_STATE) {
    this._subViewState = initialSubView;
    makeObservable<SubViewState<VIEW_STATE>, "_subViewState">(this, {      
      "_subViewState": observable,
      subViewState: computed,
//      subViewName: computed,
    })
  }
}
