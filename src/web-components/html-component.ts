import {
  ComponentEvent
} from "./component-event";

interface AppendableCallback<T extends HtmlComponent = HtmlComponent> {
  (htmlComponent: T): Appendable;
}
export type AppendableItem<T extends HtmlComponent = HtmlComponent> = AppendableCallback<T> | HtmlComponent | Node | string | undefined | false;
export type Appendable<T extends HtmlComponent = HtmlComponent> = AppendableItem<T> | AppendableItem<T>[] | Appendable<T>[];


export class Attributes {
  name?: string;
  id?: string;
  value?: string;
  style?: string;
  class?: string | string[];
  text?: string;
}


export class HtmlComponent<
  OPTIONS extends Attributes = Attributes,
  TOP_LEVEL_ELEMENT extends HTMLElement = HTMLElement  
> {
  detachEvent = new ComponentEvent(this);
  childComponents = new Set<HtmlComponent>();

  private static uniqueElementIdCounter: number = 0;

  /**
   * Generate a unique ID for a node
   * @param nonUniqueName
   */
  uniqueNodeId = (nonUniqueName: string = "id"): string =>
    `${nonUniqueName}::${(HtmlComponent.uniqueElementIdCounter++).toString()}`;
  
  constructor(
    public readonly  options: OPTIONS,
    public readonly primaryElement: TOP_LEVEL_ELEMENT = document.createElement("div") as unknown as TOP_LEVEL_ELEMENT
  ) {
    this.detachEvent.on(() => this.remove());
    const {text, class: Class} = this.options;
    for (const key of ["id", "name", "style", "value"] as const) {
      const val = options[key];
      if (typeof val === "string") {
        this.primaryElement.setAttribute(key, val);
      }
    }
    // Give the object a class for each class it belongs to
    // for (var obj: object | undefined = this; obj != null; obj = (obj as {super?: object}).super) {
    //   this.primaryElement.classList.add(obj.constructor.name)
    // }
    const nameOfDescendantClass = this.constructor.name;
    if (nameOfDescendantClass != "HtmlElement") {
      this.primaryElement.classList.add(nameOfDescendantClass);
    }
    if (typeof text === "string" && this.primaryElement.innerText != null) {
      this.primaryElement.innerText = text;
    }
    if (Class != null) {
      const classes: string[] = typeof Class === "string" ?
        [Class] :
        Array.isArray(Class) ?
          [...Class] : [];
      this.primaryElement.classList.add(...classes);
    }
    this.renderSoon();
  }

  protected parentComponent?: HtmlComponent;
  public get parent() { return this.parentComponent; }

  /**
   * Get the ID of the primary element.
   * Like a defense attorney, one will be assigned if the element doesn't already have one.
   */
  public get primaryElementId(): string {
    if (this.primaryElement.id == null || this.primaryElement.id.length === 0 ) {
      this.primaryElement.id = this.uniqueNodeId(this.constructor.name);
    }
    return this.primaryElement.id;
  }


  /**
   * Help build element accessors
   */
  protected getField = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | undefined;
  protected getInputField = (id: string) => this.getField<HTMLInputElement>(id);

  /**
   * Clear all sub-elements
   */
  clear() {
    // while (this.primaryElement.children.length > 0) {
    //   this.primaryElement.removeChild(this.primaryElement.children[0]);
    // }
    this.primaryElement.innerHTML = "";
    this.removeAllChildren();
  }

  /**
   * Re-render this entire element.
   * 
   * Inherit and call super when extending to ensure old elements
   * are cleared out before the render begins.
   */
  render(): void | Promise<void> {
    this.clear();
  }

  private renderTimeout?: number | NodeJS.Timeout;
  /**
   * Kick off an element render operation soon
   * (but not immediately, as constructors may need to finish first)
   */
  renderSoon = () => {
    if (typeof this.renderTimeout !== "undefined" || this.alreadyRemoved) {
      return;
    }
    this.renderTimeout = setTimeout( () => {
      try {
        if (!this.alreadyRemoved) {
          this.render();
        }
      } finally {
        this.renderTimeout = undefined;
      }
    }, 1);
  }

  private alreadyRemoved = false;
  remove(): boolean {
    if (this.alreadyRemoved) {
      // No need to remove, so return false
      return false;
    }
    // Make sure we only remove once;
    this.alreadyRemoved = true;
    // Send remove events to all children
    this.removeAllChildren();
    // Send remove event to parent
    if (this.primaryElement.parentElement) {
      this.primaryElement.remove();
    }
    // Send detach events
    this.detachEvent.send();
    // Give all events a 1000ms to fire, then remove all event listeners
    setTimeout(() => { ComponentEvent.removeAllEventListeners(this) }, 1000);
    //
    if (this.parent) {
      this.parent.renderSoon();
    }
    return true;
  }

  protected trackChild = (child: HtmlComponent) => {
    this.childComponents.add(child);
  }

  protected removeChild = (child: HtmlComponent): boolean => {
    if (this.childComponents.has(child)) {
      this.childComponents.delete(child);
      // Return true only if we had this child and the child had
      // not already removed itself
      return child.remove();
    }
    return false;
  }

  protected removeAllChildren = () => {
    [...this.childComponents].forEach( child => this.removeChild(child) );
  }

  /**
   * Append HTML onto the primary element.
   * 
   * @param html 
   */
  appendHtml(html: string): this {
    // We can't simply add the HTML like this...
    //   `this.primaryElement.innerHTML += html;`
    // because that might mess up any existing children.

    // So, we create a temporary div...
    const div = document.createElement("div");
    // insert the HTML we want to append to this element into the div instead
    div.innerHTML = html;
    // append the resulting nodes onto this element
    // (_without_ touching any existing nodes, as innerHTML += would)
    this.primaryElement.append(...div.childNodes);
    // and then clean up that temporary div.
    div.remove();
    return this;
  }

  appendText(text: string): this {
    const div = document.createElement("div");
    div.innerText = text;
    this.primaryElement.append(...div.childNodes);
    div.remove();
    return this;
  }

  /**
   * Append a child component
   * 
   * @param child 
   */
  appendChild<HTML_COMPONENT extends HtmlComponent>(
    child: HTML_COMPONENT
  ): HTML_COMPONENT {
    this.primaryElement.appendChild(child.primaryElement);
    this.trackChild(child);
    child.parentComponent = this;
    return child;
  }

  /*
    Append a list of components, nodes, or HTML strings.
  */
  append(
    ...items: Appendable<this>[]
  ): this {
    for (const child of items) {
      if (child == null || child === false) {
        // skip undefined/null entries
      } else if (typeof child === "function") {
        this.append(child(this));
      } else if (Array.isArray(child)) {
        this.append(...child);
      } else if (typeof child === "string") {
        this.appendHtml(child);
      } else if (child instanceof HtmlComponent) {
        this.appendChild(child);
      } else {
        this.primaryElement.append(child);
      }
    }
    return this;
  }

  setInnerText(text: string) {
    this.primaryElement.innerText = text;
    return this;
  }
  
  with = (callback: (t: this) => any): this => {
    callback(this);
    return this;
  }

  withElement = (callback: (t: TOP_LEVEL_ELEMENT) => any): this => {
    callback(this.primaryElement);
    return this;
  }

  /**
   * Create a child ement that can be replaced
   */
  replaceableChild = <HTML_COMPONENT extends HtmlComponent>(): ReplaceableChild<HTML_COMPONENT> => {
    var oldChild: HTML_COMPONENT | undefined = undefined;
    const replace = <ACTUAL_HTML_COMPONENT extends HTML_COMPONENT = HTML_COMPONENT>(
      child: ACTUAL_HTML_COMPONENT
    ): ACTUAL_HTML_COMPONENT => {
      // if (child == null) {
      //   if (oldChild) {
      //     oldChild.remove();
      //   }
      //   return child;
      // }
      if (oldChild != null && oldChild.primaryElement.parentNode != null && this.childComponents.has(oldChild)) {
        oldChild.primaryElement.replaceWith(child.primaryElement);
        oldChild.remove();
      } else {
        this.primaryElement.appendChild(child.primaryElement);
      }
      this.trackChild(child);
      child.parentComponent = this;
      oldChild = child;
      return child;
    }
    return replace;
  }
}
export interface ReplaceableChild<HTML_COMPONENT extends HtmlComponent> {
  (child: HTML_COMPONENT): HTML_COMPONENT
}