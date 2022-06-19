import { action, makeAutoObservable } from "mobx";
import { withDefined } from "../../utilities/with-defined";

export type MakeThisElementsBoundsObservable = (element?: HTMLElement | null) => void;

type SetObservableBoundsFunction = (newBounds: DOMRectReadOnly) => void;
export class ObservableBounds {
  contentRect: DOMRectReadOnly = new DOMRectReadOnly();

  private setBounds = action ( (newBounds: DOMRectReadOnly) => {
    this.contentRect = newBounds;
  })

  private constructor() {
    makeAutoObservable(this);
}

  static create = (): [ObservableBounds, SetObservableBoundsFunction] => {
    const observableBounds = new ObservableBounds();
    const setObservableBounds = observableBounds.setBounds;
    return [observableBounds, setObservableBounds];
  }
}


class ReactObservableBounds {
  private element?: HTMLElement = undefined;
  observableBounds: ObservableBounds;
  private setObservableBounds: SetObservableBoundsFunction;
  private resizeObserver?: ResizeObserver;

  static create = (): [ObservableBounds, MakeThisElementsBoundsObservable] => {
    const {observableBounds, setElementRef} = new ReactObservableBounds();
    return [observableBounds, setElementRef];
  }
  
  private constructor() {
    [this.observableBounds, this.setObservableBounds] = ObservableBounds.create();
  }
  private resizeObserverCallback: ResizeObserverCallback = ( entries ) => entries.forEach( entry => {
      if (entry.target === this.element) {
        this.setObservableBounds(entry.target.getBoundingClientRect());
      }
    })

  private clearElement = action( () => {
    withDefined( this.element, element => {
      this.resizeObserver?.unobserve(element)
      this.element = undefined;
    });
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  })

  private setElementRef: MakeThisElementsBoundsObservable = action( (element?: HTMLElement | null) => {
    if (!element) {
      this.clearElement();
    } else if ( element !== this.element) {
      this.clearElement();
      this.element = element;
      this.setObservableBounds(element.getBoundingClientRect());
      this.resizeObserver = new ResizeObserver(this.resizeObserverCallback);
      this.resizeObserver.observe( element );
    }
  })
}

export const createReactObservableBounds = ReactObservableBounds.create;
