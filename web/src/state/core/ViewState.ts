import { addressBarState } from "./AddressBarState";

// export interface ViewState<VIEW_NAME extends string> {
//   viewName: VIEW_NAME;
// }

interface NavigationPathState {
  fromRootToLeftOfHere: string;
  fromRootToHereInclusive: string;
  fromHereToEndOfPathInclusive: string;
  fromRightOfHereToEndOfPath: string;
  thisPathElement: string;
  getPath: () => string;
  pushAddressBarNavigationState: (restoreStateFn: () => void) => void;
  replaceAddressBarNavigationState: (restoreStateFn?: () => void) => void;
}

export interface ViewState<VIEW_NAME extends string = string> {
  viewName: VIEW_NAME;
  navState: NavigationPathState;
}

// export class ViewState<VIEW_NAME extends string> implements ViewState<VIEW_NAME> {
//   get path(): string { return `${this.basePath}${this.viewName.length > 0 ? `/${this.viewName}` : ""}` };
//   constructor(readonly viewName: VIEW_NAME, readonly basePath: string) {}

//   pushAddressBarNavigationState = (restoreStateFn: () => void) => {
//     addressBarState.pushState(this.path, restoreStateFn)
//   }

//   replaceAddressBarNavigationState = (restoreStateFn?: () => void) => {
//     addressBarState.replaceState(this.path, restoreStateFn)
//   }

// }

export class NavState implements NavigationPathState {
  get fromRightOfHereToEndOfPath(): string {
    const {fromHereToEndOfPathInclusiveStrObjOrFn} = this;
    switch(typeof fromHereToEndOfPathInclusiveStrObjOrFn) {
      case "function": return fromHereToEndOfPathInclusiveStrObjOrFn();
      case "string": return fromHereToEndOfPathInclusiveStrObjOrFn;
      default: return "";
    }
  }
  get fromRootToLeftOfHere(): string {
    const {fromRootToLeftOfHereStrOrNavState: fromRootToLeftOfHereStrOrObj} = this;
    switch (typeof fromRootToLeftOfHereStrOrObj) {
      case "string": return fromRootToLeftOfHereStrOrObj;
      case "object": return fromRootToLeftOfHereStrOrObj.fromRootToHereInclusive;
    }

  }
  get thisPathElementStr(): string {
    const {thisPathElementStrOrFn: localPathStrOrFn} = this;
    switch(typeof localPathStrOrFn) {
      case "function": return localPathStrOrFn();
      case "string": return localPathStrOrFn;
    }
  }
  get thisPathElement(): string {
    const {thisPathElementStr} = this;
    return thisPathElementStr.length > 0 ? `/${thisPathElementStr}` : "";
  }
  get fromRootToHereInclusive(): string { return `${this.fromRootToLeftOfHere}${this.thisPathElement}`};
  get fromHereToEndOfPathInclusive(): string { return `${this.thisPathElement}${this.fromRightOfHereToEndOfPath}` };
  getPath = (): string => {
    return `${this.fromRootToLeftOfHere}${this.thisPathElement}${this.fromRightOfHereToEndOfPath}`
  };

  static root = new NavState("", "");

  constructor(
    private readonly fromRootToLeftOfHereStrOrNavState: string | NavState,
    private readonly thisPathElementStrOrFn: string | (() => string),
    private readonly fromHereToEndOfPathInclusiveStrObjOrFn?: string | (() => string)
  ) {}

  matchesRelativePath = (relativePath: string): boolean => {
    const {thisPathElement} = this;
    return thisPathElement.length > 0 && relativePath.startsWith(thisPathElement);
  }

  pushAddressBarNavigationState = (restoreStateFn: () => void) => {
    addressBarState.pushState(this.getPath(), restoreStateFn)
  }

  replaceAddressBarNavigationState = (restoreStateFn?: () => void) => {
    addressBarState.replaceState(this.getPath(), restoreStateFn)
  }

}


// export class NamedViewState<VIEW_NAME extends string> implements ViewState<VIEW_NAME> {
//   constructor(readonly viewName: VIEW_NAME) {}
// }
