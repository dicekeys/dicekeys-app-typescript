import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";

export type StateModificationFunction = () => void;

interface StateStackElement {
  stateChangeFunction: StateModificationFunction;
  undoStateChangeFn: StateModificationFunction;
  path: string;
}

export class AddressBarState {
  protected stateStack: StateStackElement[] = [];
  historyIndex: number = -1;

  get current() { return this.stateStack[this.historyIndex] }

  get path(): string { return this.current?.path ?? ""}


  back = () => {
    const newHistoryIndex = this.historyIndex - 1;
    if (newHistoryIndex >= -1) {
      this.moveToHistoryIndex(newHistoryIndex);
    }
  }

  moveToHistoryIndex(targetHistoryIndex: number) {
    // console.log(`moveToHistoryIndex for target Index ${targetHistoryIndex} initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    while (this.historyIndex > targetHistoryIndex) {
      // We need to undo state changes until we're back to the previous state
      try { this.current?.undoStateChangeFn(); } catch {}
      this.historyIndex--;
    }
    while (this.historyIndex < targetHistoryIndex && this.stateStack.length > this.historyIndex + 1) {
      // We need to redo state changes to move forward in history
      this.historyIndex++;
      try {this.current?.stateChangeFunction()} catch {}
    }
    // console.log(`moveToHistoryIndex state completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
  }

  pushState(
    pathStrOrFn: string | (() => string),
    stateChangeFunction: StateModificationFunction,
    undoStateChangeFn: StateModificationFunction
  ) {
    // console.log(`pushState initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    if (this.stateStack.length - 1 > this.historyIndex) {
      this.stateStack = this.stateStack.slice(0, this.historyIndex + 1);
    }
    stateChangeFunction();
    const pathStr = typeof pathStrOrFn === "string" ? pathStrOrFn : pathStrOrFn();
    const path = pathStr.length === 0 ?  "/" : pathStr;
    this.historyIndex = this.stateStack.length;
    this.stateStack.push({path, stateChangeFunction: stateChangeFunction, undoStateChangeFn});
    // console.log(`pushState completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    return path;
  }

  replaceState(
    pathStrOrFn: string | (() => string),
    stateChangeFunction: StateModificationFunction,
    undoStateChangeFn?: StateModificationFunction
  ) {
    // console.log(`replaceState initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    stateChangeFunction();
    const pathStr = typeof pathStrOrFn === "string" ? pathStrOrFn : pathStrOrFn();
    const path = pathStr.length === 0 ?  "/" : pathStr;
    if (this.stateStack.length === 0) {
      this.pushState(path, stateChangeFunction, undoStateChangeFn ?? (() => {}));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.stateStack[this.historyIndex] = {path, stateChangeFunction: stateChangeFunction, undoStateChangeFn: undoStateChangeFn ?? this.stateStack[0]!.undoStateChangeFn };
    }
    // console.log(`replaceState completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    return path;
  }
}

interface AddressBarHistoryStateIdentifier {
  historyIndex: number;
}

class BrowserAddressBarState extends AddressBarState {

  override back = () => {
    if (this.stateStack.length === 0) {
      // There's nowhere back to go so we need to do a hard navigation to the top.
      // This can occur if we start by a deep load, e.g. to "/assemble"
    } else {
      window.history.back();
    }
  }

  override pushState(
    pathStrOrFn: string | (() => string),
    stateChangeFunction: StateModificationFunction,
    undoStateChangeFn: StateModificationFunction
  ) {
    // console.log(`push state initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"="${window.location.pathname}"`)
    const path = super.pushState(pathStrOrFn, stateChangeFunction, undoStateChangeFn);
    const historyStateIdentifier: AddressBarHistoryStateIdentifier = {historyIndex: this.stateStack.length + 1}
    window.history.pushState(historyStateIdentifier, '', path);
    // console.log(`push state completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`);
    return path;
  }

  override replaceState(
    pathStrOrFn: string | (() => string),
    stateChangeFunction: StateModificationFunction,
    undoStateChangeFn?: StateModificationFunction
  ) {
    // console.log(`replace state initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    const historyStateIdentifier: AddressBarHistoryStateIdentifier = {historyIndex: this.historyIndex}
    const path = super.replaceState(pathStrOrFn, stateChangeFunction, undoStateChangeFn);
    window.history.replaceState(historyStateIdentifier, '', path);
    // console.log(`replace state completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"="${path}"="${window.location.pathname}"`);
    return path;
  }

  #onPopStateEvent = (ev: PopStateEvent) => {
    const {state} = ev;
    const {historyIndex = -1} = ((typeof state === "object" && state != null) ? state as AddressBarHistoryStateIdentifier : {historyIndex: undefined});
    this.moveToHistoryIndex(historyIndex);
  }
  
  constructor() {
    super();
    window.addEventListener('popstate', this.#onPopStateEvent);
  }
}

class ElectronMockAddressBarState extends AddressBarState {
}

export const addressBarState: AddressBarState = RUNNING_IN_ELECTRON ?
  new ElectronMockAddressBarState() :
  new BrowserAddressBarState();
