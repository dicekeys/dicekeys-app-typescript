import { action } from "mobx";
import { makeAutoObservable } from "mobx";

export interface HoverStateActions {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}
export class HoverState<T extends string> {
  state?: T;

  onMouseEnter = (of: T) => action( () => {
    this.state = of;
  });
  onMouseLeave = (of: T) => action ( () => {
    if (this.state === of) {
      this.state = undefined;
    }
  })
  hoverStateActions = (of: T): HoverStateActions => ({
    onMouseEnter: this.onMouseEnter(of),
    onMouseLeave: this.onMouseLeave(of)
  });

  constructor() {
    makeAutoObservable(this);
  }
}