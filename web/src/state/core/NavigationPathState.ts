
export class NavigationPathState {
  #fromRootToLeftOfHereStrOrNavState: string | NavigationPathState;
  #thisPathElementStrOrFn: string | (() => string);
  #fromRightOfHereToEndOfPathInclusiveStrObjOrFn: string | (() => string);

  get fromRootToLeftOfHereStrOrNavState() { return this.#fromRootToLeftOfHereStrOrNavState; }
  get thisPathElementStrOrFn() { return this.#thisPathElementStrOrFn; }
  get fromRightOfHereToEndOfPathInclusiveStrObjOrFn() { return this.#fromRightOfHereToEndOfPathInclusiveStrObjOrFn; }

  setFromRootToLeftOfHere(newValue: string | NavigationPathState) { return this.#fromRootToLeftOfHereStrOrNavState = newValue; }
  setThisPathElement(newValue: string | (() => string)) { return this.#thisPathElementStrOrFn = newValue; }
  setFromRightOfHereToEndOfPathInclusive(newValue: string | (() => string) | undefined) { return this.#fromRightOfHereToEndOfPathInclusiveStrObjOrFn = newValue ?? ""; }

  get fromRightOfHereToEndOfPath(): string {
    const fromHereToEndOfPathInclusiveStrObjOrFn = this.#fromRightOfHereToEndOfPathInclusiveStrObjOrFn;
    switch (typeof fromHereToEndOfPathInclusiveStrObjOrFn) {
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
    switch (typeof thisPathElementStrOrFn) {
      case "function": return thisPathElementStrOrFn();
      case "string": return thisPathElementStrOrFn;
    }
  }
  get thisPathElement(): string {
    const thisPathElementStr = this.thisPathElementStr;
    return thisPathElementStr.length > 0 ? `/${thisPathElementStr}` : "";
  }
  get fromRootToHereInclusive(): string { return `${this.fromRootToLeftOfHere}${this.thisPathElement}`; }
  get fromHereToEndOfPathInclusive(): string { return `${this.thisPathElement}${this.fromRightOfHereToEndOfPath}`; }
  getPath = (): string => {
    const path = `${this.fromRootToLeftOfHere}${this.thisPathElement}${this.fromRightOfHereToEndOfPath}`;
    return path;
    //    return path.length === 0 ? "/" : path;
  };
  get path(): string {
    return this.getPath();
  }

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
  };

}
