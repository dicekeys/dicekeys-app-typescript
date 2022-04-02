import { action, computed, makeObservable, observable } from "mobx";
import { addressBarState } from "./AddressBarState";
import { NavigationPathState, ViewState } from "./ViewState";

import {CustomEvent} from "../../utilities/event";

export class SubViewState<VIEW_STATE extends ViewState> {
  protected _subViewState: VIEW_STATE | undefined;
  readonly subStateChangedEvent = new CustomEvent<[VIEW_STATE | undefined, VIEW_STATE | undefined], this>(this);

  get subViewState() { return this._subViewState; }
  rawSetSubView = action( (destinationSubViewState?: VIEW_STATE) => {
    const previousSubViewState = this._subViewState;
    this._subViewState = destinationSubViewState;
    this.subStateChangedEvent.send(previousSubViewState, destinationSubViewState);
    return this;
  });

  /***
   * Navigate to a subview
   */
  navigateToPushState = (destinationSubViewState: VIEW_STATE) => {
    const previousSubViewState = this.subViewState;
    if (destinationSubViewState != previousSubViewState) {
      const doStateChange = () => {
        this.rawSetSubView(destinationSubViewState);
      };
      const undoStateChange = () => {
        this.rawSetSubView(previousSubViewState);
      }
      addressBarState.pushState(this.navState.getPath, doStateChange, undoStateChange);
    }
  };

  navigateToReplaceState = (
    destinationSubViewState: VIEW_STATE | undefined = undefined
  ) => {
    const doStateChange = () => {
      this.rawSetSubView(destinationSubViewState);
    };
    addressBarState.replaceState(this.navState.getPath, doStateChange);
  };

  constructor(public navState: NavigationPathState, defaultSubView?: VIEW_STATE) {
    this._subViewState = defaultSubView;
    makeObservable<SubViewState<VIEW_STATE>, "_subViewState">(this, {      
      "_subViewState": observable,
      subViewState: computed,
//      subViewName: computed,
    })
  }
}
