
// TO DO: QueuedUrlApiRequests, replace transmitResponseUrl: (responseURL: URL) => any = (url: URL) => window.location.replace(url.toString());

import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";

interface AddressBarState {
  path: string;
  back: () => void;
  onPopState: (callback: (path: string) => any) => void;
  pushState: (path: string) => void;
  replaceState: (path: string) => void;
}

class BrowserAddressBarState implements AddressBarState {
  get path(): string {return window.location.pathname}
  back = () => window.history.back();
  onPopState = (callback: (path: string) => any) => window.addEventListener('popstate', () => callback(window.location.pathname));
  pushState = (path: string) => window.history.pushState({}, '', path);
  replaceState = (path: string) => window.history.replaceState({}, '', path);
}

class ElectronMockAddressBarState implements AddressBarState {
  private pathStack: string[] = ["/"];
  private popStateCallbacks = new Set<(path: string) => void>();
  get path(): string {return this.pathStack[0]}
  back = () => {
    if (this.pathStack.length > 1) {
      this.pathStack.shift();
      [...this.popStateCallbacks].forEach( callback => {
        callback(this.path) 
      });  
    }
  }
  onPopState = (callback: (path: string) => any) => this.popStateCallbacks.add(callback);
  pushState = (path: string) => this.pathStack.unshift(path);
  replaceState = (path: string) => this.pathStack[0] = path;
}

export const addressBarState: AddressBarState = RUNNING_IN_ELECTRON ?
  new ElectronMockAddressBarState() :
  new BrowserAddressBarState();
