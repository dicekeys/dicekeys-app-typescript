
export class CompoonentEvent<ARGS extends any[] = [], CHAIN = any> {
  private callbacks = new Set<(...args: ARGS)=> any>();
  constructor(private chainObject: CHAIN) {}
  
  on = (callback: (...args: ARGS) => any) => {
      this.callbacks.add(callback);
      return this.chainObject;
  }

  remove = (callback: (...args: ARGS) => any) => {
    this.callbacks.delete(callback);
    return this.chainObject;
  }

  send = (...args: ARGS) => {
    for (const callback of this.callbacks) {
      callback(...args);
    }
    return this.chainObject;
  }
};

export interface HtmlComponentOptions {
  nodeToInsertThisComponentBefore?: Node;
  parentElement?: HTMLElement;
  html?: string;

}

export  interface HtmlComponentConstructorOptions extends HtmlComponentOptions {
  containerElement?: HTMLElement;
}

export class HtmlComponent<T = void> {
  public readonly containerElement: HTMLElement;
  public parentElement: HTMLElement | undefined;

  constructor(
    protected readonly constructorOptions: HtmlComponentConstructorOptions = {}
  ) {
    const {
      containerElement = document.createElement("div"),
      html
    } = constructorOptions;
    this.containerElement = containerElement;
    if (html) {
      this.containerElement.innerHTML = html;
    }
  }

  public attach(
    options: HtmlComponentOptions = {} 
  ) {
    const allOptions = {...this.constructorOptions, ...options};
    const {
      parentElement = document.body,
      nodeToInsertThisComponentBefore = null
    } = allOptions;
    if (options.html) {
      this.containerElement.innerHTML = options.html; 
    }
    this.parentElement = parentElement;
    this.parentElement.insertBefore(this.containerElement, nodeToInsertThisComponentBefore);
    return this;
  }

  public detach() {
    this.parentElement?.removeChild(this.containerElement);
    this.detachEvent.send();
    return this;
  }

  public readonly detachEvent = new CompoonentEvent(this);

}