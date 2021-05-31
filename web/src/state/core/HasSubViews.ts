import { action, computed, makeObservable, observable } from "mobx";

export abstract class HasSubViews<SUB_VIEW> {

  protected _previousSubView: SUB_VIEW | undefined;
  protected _subView: SUB_VIEW;

  /***
   * Set the sub view without triggering onNavigateTo event
   */
  protected rawSetSubView = action( (destinationSubView: SUB_VIEW) => {
    this._previousSubView = this._subView;
    this._subView = destinationSubView;
  });

  /***
   * Navigate to a different subview
   */
  protected navigateTo = action( (destinationSubView: SUB_VIEW) => {
    this.rawSetSubView(destinationSubView);
    this.onNavigateTo?.(this.subView, this.previousSubView);
  });

  /***
   * Create a function to navigate to a specific subview
   */
  protected navigateToSubView = (destinationSubView: SUB_VIEW) => () => {
    this.navigateTo(destinationSubView);
  }

  get subView(): SUB_VIEW { return this._subView; }
  get previousSubView(): SUB_VIEW | undefined { return this._previousSubView; }

  constructor(defaultSubView: SUB_VIEW, private onNavigateTo?: (subView: SUB_VIEW, previousSubView: SUB_VIEW | undefined) => any) {
    this._subView = defaultSubView;
    makeObservable<HasSubViews<SUB_VIEW>, "_subView">(this, {      
      "_subView": observable,
      subView: computed,
    })
  }
}
