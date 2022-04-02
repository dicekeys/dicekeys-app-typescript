import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";

export type StateModificationFunction = () => void;

interface StateStackElement {
  stateChangeFuntion: StateModificationFunction;
  undoStateChangeFn: StateModificationFunction;
  path: string;
}

export class AddressBarState {
  protected stateStack: StateStackElement[] = [];
  historyIndex: number = -1;

  get current() { return this.stateStack[this.historyIndex] }

  get path(): string { return this.current?.path ?? ""};

  back = () => {
    const newHistoryIndex = this.historyIndex - 1;
    if (newHistoryIndex >= -1) {
      this.moveToHistoryIndex(newHistoryIndex);
    }
  }

  moveToHistoryIndex(historyIndex: number) {
    console.log(`moveToHistoryIndex state initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    while (this.historyIndex > historyIndex) {
      // We need to undo state changes until we're back to the previous state
      try { this.current?.undoStateChangeFn(); } catch {}
      this.historyIndex--;
    }
    while (this.historyIndex < historyIndex && this.stateStack.length > this.historyIndex + 1) {
      // We need to redo state changes to move forward in history
      this.historyIndex++;
      try {this.current?.stateChangeFuntion()} catch {}
    }
    console.log(`moveToHistoryIndex state completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
  }

  pushState(
    pathStrOrFn: string | (() => string),
    stateChangeFuntion: StateModificationFunction,
    undoStateChangeFn: StateModificationFunction
  ) {
    if (this.stateStack.length - 1 > this.historyIndex) {
      this.stateStack = this.stateStack.slice(0, this.historyIndex + 1);
    }
    stateChangeFuntion();
    const pathStr = typeof pathStrOrFn === "string" ? pathStrOrFn : pathStrOrFn();
    const path = pathStr.length === 0 ?  "/" : pathStr;
    this.historyIndex = this.stateStack.length;
    this.stateStack.push({path, stateChangeFuntion, undoStateChangeFn});
    return path;
  }

  replaceState(
    pathStrOrFn: string | (() => string),
    stateChangeFuntion: StateModificationFunction,
    undoStateChangeFn?: StateModificationFunction
  ) {
    stateChangeFuntion();
    const pathStr = typeof pathStrOrFn === "string" ? pathStrOrFn : pathStrOrFn();
    const path = pathStr.length === 0 ?  "/" : pathStr;
    if (this.stateStack.length === 0) {
      this.pushState(path, stateChangeFuntion, undoStateChangeFn ?? (() => {}));
    } else {
      this.stateStack[this.historyIndex] = {path, stateChangeFuntion, undoStateChangeFn: undoStateChangeFn ?? this.stateStack[0]!.undoStateChangeFn };
    }
    return path;
  }

  // setInitialState(
  //   path: string,
  //   restoreFn?: StateModificationFunction
  // ) {
  //   if (this.stateStack.length === 0) {
  //     this.historyIndex = 0;
  //     this.stateStack.push({path, stateChangeFuntion: () => {}, undoStateChangeFn: restoreFn ?? ((() => {}))});
  //   }
  // }

}

interface AddressBarHistoryStateIdentifier {
  historyIndex: number;
}

class BrowserAddressBarState extends AddressBarState {

//  override get path(): string { return window.location.pathname }

  override back = () => {
    if (this.stateStack.length === 0) {
      // There's nowhere back to go so we need to do a hard navigation to the top.
      // This can occur if we start by a deep load, e.g. to "/assemble"
      // FIXME
    } else {
      window.history.back();
    }
  }

  override pushState(
    pathStrOrFn: string | (() => string),
    stateChangeFuntion: StateModificationFunction,
    undoStateChangeFn: StateModificationFunction
  ) {
    console.log(`push state initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"="${window.location.pathname}"`)
    const path = super.pushState(pathStrOrFn, stateChangeFuntion, undoStateChangeFn);
    const historyStateIdentifier: AddressBarHistoryStateIdentifier = {historyIndex: this.stateStack.length + 1}
    window.history.pushState(historyStateIdentifier, '', path);
    console.log(`push state completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`);
    return path;
  }

  override replaceState(
    pathStrOrFn: string | (() => string),
    stateChangeFuntion: StateModificationFunction,
    undoStateChangeFn?: StateModificationFunction
  ) {
    console.log(`replace state initiated at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"`)
    const historyStateIdentifier: AddressBarHistoryStateIdentifier = {historyIndex: this.historyIndex}
    const path = super.replaceState(pathStrOrFn, stateChangeFuntion, undoStateChangeFn);
    window.history.replaceState(historyStateIdentifier, '', path);
    console.log(`replace state completed at depth ${this.historyIndex} (${this.stateStack.length}) with path "${this.path}"="${path}"="${window.location.pathname}"`);
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
