import { action, computed, makeObservable, observable } from "mobx";

export abstract class HasSubViews<SUB_VIEWS> {

  protected _subView: SUB_VIEWS;

  protected navigateTo = action( (destinationSubView: SUB_VIEWS) => {
    this._subView = destinationSubView;
  });

  protected navigateToSubView = (destinationSubView: SUB_VIEWS) => () => this.navigateTo(destinationSubView);

  get subView(): SUB_VIEWS | undefined { return this._subView; }

  constructor(defaultSubView: SUB_VIEWS) {
    this._subView = defaultSubView;
    makeObservable<HasSubViews<SUB_VIEWS>, "_subView">(this, {      
      "_subView": observable,
      subView: computed,
    })
  }
}
