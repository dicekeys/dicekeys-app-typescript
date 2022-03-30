// import { addressBarState } from "./AddressBarState";

// export interface ViewState<VIEW_NAME extends string> {
//   viewName: VIEW_NAME;
// }

// interface NavigationPathState {
//   fromRootToLeftOfHere: string;
//   fromRootToHereInclusive: string;
//   fromHereToEndOfPathInclusive: string;
//   fromRightOfHereToEndOfPath: string;
//   thisPathElement: string;
//   getPath: () => string;
//   pushAddressBarNavigationState: (restoreStateFn: () => void) => void;
//   replaceAddressBarNavigationState: (restoreStateFn?: () => void) => void;
// }

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

export class NavigationPathState {
  #fromRootToLeftOfHereStrOrNavState: string | NavigationPathState;
  #thisPathElementStrOrFn: string | (() => string);
  #fromRightOfHereToEndOfPathInclusiveStrObjOrFn: string | (() => string);

  get fromRootToLeftOfHereStrOrNavState() { return this.#fromRootToLeftOfHereStrOrNavState ; }
  get thisPathElementStrOrFn() { return this.#thisPathElementStrOrFn ; }
  get fromRightOfHereToEndOfPathInclusiveStrObjOrFn() { return this.#fromRightOfHereToEndOfPathInclusiveStrObjOrFn ; }

  setFromRootToLeftOfHere(newValue: string | NavigationPathState) { return this.#fromRootToLeftOfHereStrOrNavState = newValue ; }
  setThisPathElement(newValue: string | (() => string)) { return this.#thisPathElementStrOrFn = newValue ; }
  setFromRightOfHereToEndOfPathInclusive(newValue: string | (() => string) | undefined) { return this.#fromRightOfHereToEndOfPathInclusiveStrObjOrFn = newValue ?? "" ; }

  get fromRightOfHereToEndOfPath(): string {
    const fromHereToEndOfPathInclusiveStrObjOrFn = this.#fromRightOfHereToEndOfPathInclusiveStrObjOrFn;
    switch(typeof fromHereToEndOfPathInclusiveStrObjOrFn) {
      case "function": return fromHereToEndOfPathInclusiveStrObjOrFn();
      case "string": return fromHereToEndOfPathInclusiveStrObjOrFn;
      default: return "";
    }
  }
  get fromRootToLeftOfHere(): string {
    const fromRootToLeftOfHereStrOrNavState = this.#fromRootToLeftOfHereStrOrNavState;
    switch (typeof fromRootToLeftOfHereStrOrNavState) {
      case "string": return fromRootToLeftOfHereStrOrNavState;
      case "object": return fromRootToLeftOfHereStrOrNavState.fromRootToHereInclusive;
    }

  }
  get thisPathElementStr(): string {
    const thisPathElementStrOrFn = this.#thisPathElementStrOrFn;
    switch(typeof thisPathElementStrOrFn) {
      case "function": return thisPathElementStrOrFn();
      case "string": return thisPathElementStrOrFn;
    }
  }
  get thisPathElement(): string {
    const thisPathElementStr = this.thisPathElementStr;
    return thisPathElementStr.length > 0 ? `/${thisPathElementStr}` : "";
  }
  get fromRootToHereInclusive(): string { return `${this.fromRootToLeftOfHere}${this.thisPathElement}`};
  get fromHereToEndOfPathInclusive(): string { return `${this.thisPathElement}${this.fromRightOfHereToEndOfPath}` };
  getPath = (): string => {
    const path = `${this.fromRootToLeftOfHere}${this.thisPathElement}${this.fromRightOfHereToEndOfPath}`;
    return path;
//    return path.length === 0 ? "/" : path;
  }
  get path(): string {
    return this.getPath();
  };

  static root = new NavigationPathState("", "");

  constructor(
    fromRootToLeftOfHereStrOrNavState: string | NavigationPathState,
    thisPathElementStrOrFn: string | (() => string),
    fromHereToEndOfPathInclusiveStrObjOrFn: string | (() => string) = ""
  ) {
    this.#fromRootToLeftOfHereStrOrNavState = fromRootToLeftOfHereStrOrNavState;
    this.#thisPathElementStrOrFn = thisPathElementStrOrFn;
    this.#fromRightOfHereToEndOfPathInclusiveStrObjOrFn = fromHereToEndOfPathInclusiveStrObjOrFn;
  }

  matchesRelativePath = (relativePath: string): boolean => {
    const thisPathElement = this.thisPathElement;
    return thisPathElement.length > 0 && relativePath.startsWith(thisPathElement);
  }

  // pushAddressBarNavigationState = (modifyStateFn: () => void, restoreStateFn: () => void) => {
  //   addressBarState.pushState(this.getPath(), modifyStatefn, restoreStateFn)
  // }

  // replaceAddressBarNavigationState = (modifyStateFn: () => void, restoreStateFn?: () => void) => {
  //   addressBarState.replaceState(this.getPath(), modifyStatefn, restoreStateFn)
  // }

  // setInitialState = (restoreStateFn?: () => void) => {
  //   addressBarState.setInitialState(this.getPath(), restoreStateFn);
  // }

}


// export class NamedViewState<VIEW_NAME extends string> implements ViewState<VIEW_NAME> {
//   constructor(readonly viewName: VIEW_NAME) {}
// }
