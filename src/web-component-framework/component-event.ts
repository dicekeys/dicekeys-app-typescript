export class ComponentEvent<ARGS extends any[] = [], TARGET_TYPE = any> {
  private static targetToEventsAttachedToIt = new Map<any, Set<ComponentEvent>>();

  public static removeAllEventListeners(target: any) {
    for (const event of ComponentEvent.targetToEventsAttachedToIt.get(target) ?? []) {
      event.removeAll();
    }
  }

  private callbacks = new Set<(...args: ARGS)=> any>();
  constructor(protected target: TARGET_TYPE) {
    // Track all of the events present on the parent component
    if (!ComponentEvent.targetToEventsAttachedToIt.has(target)) {
      ComponentEvent.targetToEventsAttachedToIt.set(target, new Set());
    }
    ComponentEvent.targetToEventsAttachedToIt.get(target)?.add(this);
  }
  
  on = (...callbacks: ((...args: ARGS) => any)[]): TARGET_TYPE => {
    for (const callback of callbacks) {
      this.callbacks.add(callback);
    }
    return this.target;
  }

  remove = (callback: (...args: ARGS) => any) => {
    this.callbacks.delete(callback);
    return this.target;
  }

  removeAll = () => {
    this.callbacks.clear();
  }

  send = (...args: ARGS) => {
    for (const callback of this.callbacks) {
      callback(...args);
    }
    return this.target;
  }
};
