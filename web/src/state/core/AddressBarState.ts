import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";

type RestorePreviousStateOnPopStateCallback = () => void;

// interface AddressBarState {
//   path: string;
//   back: () => void;
//   // onPopState: (callback: (path: string) => void) => void;
//   pushState: (
//     data: STATE_DATA_TYPE,
//     path: string,
//     restorePreviousStateOnPopState: RestorePreviousStateOnPopStateCallback
//   ) => void;
//   replaceState: (
//     data: STATE_DATA_TYPE,
//     path: string,
//     restorePreviousStateOnPopState?: RestorePreviousStateOnPopStateCallback
//   ) => void;
// }

export class AddressBarState {
  protected popStateCallbackStack: ( RestorePreviousStateOnPopStateCallback | undefined )[] = [];
  protected pathStack: string[] = [];

  get path(): string { return this.pathStack[0] ?? "/"};

  back() {
    this.pathStack.shift();
    const callback = this.popStateCallbackStack.shift();
    callback?.();
  }

  pushState(
    path: string,
    restorePreviousStateOnPopState?: RestorePreviousStateOnPopStateCallback
  ) {
    if ((this.pathStack[0] ?? "/") !== path) {
      // add the callback to the pathStack
      this.pathStack.unshift(path);
      this.popStateCallbackStack.unshift( restorePreviousStateOnPopState );
    }
  }

  replaceState(
    path: string,
    restorePreviousStateOnPopState?: RestorePreviousStateOnPopStateCallback
  ) {
    if (this.pathStack.length === 0) {
      this.pathStack.unshift(path);
    } else {
      this.pathStack[0] = path;
    }
    if (restorePreviousStateOnPopState != null && this.popStateCallbackStack.length > 0) {
      this.popStateCallbackStack[0] = restorePreviousStateOnPopState;
    }
  }

}

interface AddressBarDepthState {
  depth: number;
}

class BrowserAddressBarState extends AddressBarState {

  override get path(): string { return window.location.pathname }

  override back() { window.history.back(); }

  override pushState(
    path: string,
    restorePreviousStateOnPopState?: RestorePreviousStateOnPopStateCallback
  ) {
    if (window.location.pathname !== path) {
      const depthState: AddressBarDepthState = {depth: this.popStateCallbackStack.length + 1}
      window.history.pushState(depthState, '', path);
      super.pushState(path, restorePreviousStateOnPopState);
    }
  }

  override replaceState(
    path: string,
    restorePreviousStateOnPopState?: RestorePreviousStateOnPopStateCallback
  ) {
    const depthState: AddressBarDepthState = {depth: this.popStateCallbackStack.length}
    window.history.replaceState(depthState, '', path);
    super.replaceState(path, restorePreviousStateOnPopState);
  }

  constructor() {
    super();
    window.addEventListener('popstate', ( (ev) => {
      try {
        const {state} = ev;
        const {depth = 0} = ((typeof state === "object" && state != null) ? state as AddressBarDepthState : {depth: undefined});
        if (typeof depth === "number" && this.popStateCallbackStack.length > depth + 1) {
          // We're in a browser going back more than one level of depth.  Adjust the
          // length of the stacks to be one greater than the depth we want to go to so that
          // when we pop (unshift) we reach the desired spot.
          this.pathStack = this.pathStack.slice(0, depth + 1);
          this.popStateCallbackStack = this.popStateCallbackStack.slice(0, depth + 1);
        }
      } catch {
        console.error("Depth error");
      }
      super.back();
    }));
  }
}

class ElectronMockAddressBarState extends AddressBarState {
}

export const addressBarState: AddressBarState = RUNNING_IN_ELECTRON ?
  new ElectronMockAddressBarState() :
  new BrowserAddressBarState();
