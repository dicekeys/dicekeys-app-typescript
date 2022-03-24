import { action, computed, makeObservable, observable } from "mobx";
import { BaseViewState, ViewState } from "./ViewState";

export abstract class HasSubViews<MY_VIEW_NAME extends string, SUB_VIEW_NAME extends string, VIEW_STATE extends ViewState<SUB_VIEW_NAME>> extends BaseViewState<MY_VIEW_NAME> {
//  protected _previousSubView: SUB_VIEW | undefined;
  protected _subViewState: VIEW_STATE | undefined;

  get subViewState() { return this._subViewState; }
  get subViewName(): SUB_VIEW_NAME | undefined { return this.subViewState?.viewName; }

  /***
   * Set the sub view without triggering onNavigateTo event
   */
  protected rawSetSubView = action( (destinationSubView?: VIEW_STATE) => {
    this._subViewState = destinationSubView;
    return this;
  });

  /***
   * Navigate to a subview
   */
  protected navigateTo = action( (destinationSubViewState?: VIEW_STATE, changeAddressBarState?: "PushState" | "ReplaceState", onRestoreState?: () => void) => {
    const previousSubViewState = this.subViewState;
    if (destinationSubViewState != previousSubViewState) {
      const restorePreviousSubViewState = () => {
        this.rawSetSubView(previousSubViewState);
        onRestoreState?.();
      }
      this.rawSetSubView(destinationSubViewState);
      switch (changeAddressBarState) {
        case "PushState":
          this.pushAddressBarNavigationState( () => restorePreviousSubViewState ); break;
        case "ReplaceState":
          this.replaceAddressBarNavigationState( () => restorePreviousSubViewState ); break;
        default: break;
      }
    }
    return this;
  });

  // /***
  //  * Create a function to navigate to a specific subview
  //  */
  // protected navigateToSubView = (destinationSubView: VIEW_STATE) => () => {
  //   this.navigateTo(destinationSubView);
  // }

  get pathExclusiveOfSubViews(): string { return `${this.basePath}${ this.viewName.length > 0 ? `/${this.viewName}` : ``}` }
  get path(): string { return this.subViewState?.path ?? this.pathExclusiveOfSubViews }

  constructor(public readonly viewName: MY_VIEW_NAME, basePath: string, defaultSubView?: VIEW_STATE) {
    super(viewName, basePath);
    this._subViewState = defaultSubView;
    makeObservable<HasSubViews<MY_VIEW_NAME, SUB_VIEW_NAME, VIEW_STATE>, "_subViewState">(this, {      
      "_subViewState": observable,
      subViewState: computed,
      subViewName: computed,
    })
  }
}
