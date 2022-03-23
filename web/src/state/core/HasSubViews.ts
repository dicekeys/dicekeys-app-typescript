import { action, computed, makeObservable, observable } from "mobx";
import { ViewState } from "./ViewState";

export abstract class HasSubViews<VIEW_NAME extends string, VIEW_STATE extends ViewState<VIEW_NAME>> {
//  protected _previousSubView: SUB_VIEW | undefined;
  protected _subViewState: VIEW_STATE | undefined;

  get subViewState() { return this._subViewState; }
  get subViewName(): VIEW_NAME | undefined { return this.subViewState?.viewName; }

  /***
   * Set the sub view without triggering onNavigateTo event
   */
  protected rawSetSubView = action( (destinationSubView?: VIEW_STATE) => {
    this._subViewState = destinationSubView;
  });

  /***
   * Navigate to a different subview
   */
  protected navigateTo = action( (destinationSubViewState?: VIEW_STATE) => {
    const previousSubViewState = this.subViewState
    this.rawSetSubView(destinationSubViewState);
    this.onNavigateTo?.(destinationSubViewState, previousSubViewState);
  });

  /***
   * Create a function to navigate to a specific subview
   */
  protected navigateToSubView = (destinationSubView: VIEW_STATE) => () => {
    this.navigateTo(destinationSubView);
  }

  constructor(defaultSubView: VIEW_STATE | undefined, private onNavigateTo?: (subViewState: VIEW_STATE | undefined, previousSubViewState: VIEW_STATE | undefined) => any) {
    this._subViewState = defaultSubView;
    makeObservable<HasSubViews<VIEW_NAME, VIEW_STATE>, "_subViewState">(this, {      
      "_subViewState": observable,
      subViewState: computed,
      subViewName: computed,
    })
  }
}
