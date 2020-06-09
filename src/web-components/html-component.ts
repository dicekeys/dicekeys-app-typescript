
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

  public detach(t?: T) {
    this.parentElement?.removeChild(this.containerElement);
    this.sendDetachEvent(t);
    return this;
  }

  private onFactoryCallbacks = new Map<string, Set<any>>();
  onFactory = (name: string) => <T = void>(callback: (t: T)=> any) => {
    if (!this.onFactoryCallbacks.has(name)) {
      this.onFactoryCallbacks.set(name, new Set<(t: T)=> any>());
    }
    this.onFactoryCallbacks.get(name)!.add(callback);
  }

  trigger(name: string): () => void;
  trigger<T>(name: string): (t?: T) => void;
  trigger(name: string) {
    return (t: T) => {
      const callbacks = this.onFactoryCallbacks.get(name) as Set<(t: T) => any> | undefined;
      if (callbacks) {
        for (const callback of callbacks) {
          callback(t);
        }
      }
    }
  }

  public onDetach = this.onFactory("detach");
  private sendDetachEvent = this.trigger<T>("detach");

}