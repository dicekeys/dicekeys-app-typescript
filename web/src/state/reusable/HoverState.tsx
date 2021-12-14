import { action } from "mobx";
import { makeAutoObservable } from "mobx";

export interface HoverStateActions {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}
export class HoverState<T extends string> {
  private _state?: T;
  get state() { return this._state }
  readonly setState  = action( (newState: T | undefined): void => { this._state = newState; } );
  readonly setStateFn = (newState: T | undefined) => (): void => this.setState(newState);

  onMouseEnter = (of: T) => () => {
    this.setState(of);
  }
  onMouseLeave = (of: T) => () => {
    if (this.state === of) {
      this.setState(undefined);
    }
  }
  hoverStateActions = (of: T): HoverStateActions => ({
    onMouseEnter: this.onMouseEnter(of),
    onMouseLeave: this.onMouseLeave(of)
  });

  constructor(initialState?: T | undefined) {
    this._state = initialState;
    makeAutoObservable(this);
  }
}