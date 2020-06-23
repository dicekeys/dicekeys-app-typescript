export class ComponentEvent<ARGS extends any[] = [], CHAIN = any> {
  private static parentToEvents = new Map<any, Set<ComponentEvent>>();

  public static removeAllEventListeners(parent: any) {
    for (const event of ComponentEvent.parentToEvents.get(parent) ?? []) {
      event.removeAll();
    }
  }

  private callbacks = new Set<(...args: ARGS)=> any>();
  constructor(private parent: CHAIN) {
    // Track all of the events present on the parent component
    if (!ComponentEvent.parentToEvents.has(parent)) {
      ComponentEvent.parentToEvents.set(parent, new Set());
    }
    ComponentEvent.parentToEvents.get(parent)?.add(this);
  }
  
  on = (callback: (...args: ARGS) => any) => {
      this.callbacks.add(callback);
      return this.parent;
  }

  remove = (callback: (...args: ARGS) => any) => {
    this.callbacks.delete(callback);
    return this.parent;
  }

  removeAll = () => {
    this.callbacks.clear();
  }

  send = (...args: ARGS) => {
    for (const callback of this.callbacks) {
      callback(...args);
    }
    return this.parent;
  }
};
