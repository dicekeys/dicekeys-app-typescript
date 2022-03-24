import { addressBarState } from "./AddressBarState";

export interface ViewState<VIEW_NAME extends string> {
  viewName: VIEW_NAME;
  path: string;
}

export class BaseViewState<VIEW_NAME extends string> implements ViewState<VIEW_NAME> {
  get path(): string { return `${this.basePath}${this.viewName.length > 0 ? `/${this.viewName}` : ""}` };
  constructor(readonly viewName: VIEW_NAME, readonly basePath: string) {}

  pushAddressBarNavigationState = (restoreStateFn: () => void) => {
    addressBarState.pushState(this.path, restoreStateFn)
  }

  replaceAddressBarNavigationState = (restoreStateFn?: () => void) => {
    addressBarState.replaceState(this.path, restoreStateFn)
  }

}

// export class NamedViewState<VIEW_NAME extends string> implements ViewState<VIEW_NAME> {
//   constructor(readonly viewName: VIEW_NAME) {}
// }
