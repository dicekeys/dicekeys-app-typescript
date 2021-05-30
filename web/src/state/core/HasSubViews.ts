import { action, computed, makeObservable, observable } from "mobx";

export abstract class HasSubViews<SUB_VIEWS> {

  protected _subView: SUB_VIEWS;

  /***
   * Set the sub view without triggering onNavigateTo event
   */
  protected rawSetSubView = action( (destinationSubView?: SUB_VIEWS) => {
    if (destinationSubView != null) {
      this._subView = destinationSubView;
    }
  });

  /***
   * Navigate to a different subview
   */
  protected navigateTo = action( (destinationSubView: SUB_VIEWS) => {
    this._subView = destinationSubView;
    this.onNavigateTo?.(destinationSubView);
  });

  /***
   * Create a function to navigate to a specific subview
   */
  protected navigateToSubView = (destinationSubView: SUB_VIEWS) => () => {
    this.navigateTo(destinationSubView);
  }

  get subView(): SUB_VIEWS | undefined { return this._subView; }

  constructor(defaultSubView: SUB_VIEWS, private onNavigateTo?: (to: SUB_VIEWS) => any) {
    this._subView = defaultSubView;
    makeObservable<HasSubViews<SUB_VIEWS>, "_subView">(this, {      
      "_subView": observable,
      subView: computed,
    })
  }
}
