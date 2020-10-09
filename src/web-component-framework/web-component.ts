import {
  ComponentEvent
} from "./component-event";

interface AppendableCallback<T extends Component = Component> {
  (htmlComponent: T): Appendable;
}
export type AppendableItem<T extends Component = Component> = AppendableCallback<T> | Component | Node | string | undefined | false;
export type Appendable<T extends Component = Component> = AppendableItem<T> | AppendableItem<T>[] | Appendable<T>[];

export type HTMLElementTagName = keyof HTMLElementTagNameMap;
export type SVGElementTagName = keyof SVGElementTagNameMap;
export type ElementTagName = HTMLElementTagName | SVGElementTagName;
export type ElementTagNameMap<K extends ElementTagName> =
  K extends keyof HTMLElementTagNameMap ?
    HTMLElementTagNameMap :
    SVGElementTagNameMap;
export type Element<TAG_NAME extends ElementTagName = ElementTagName> = TAG_NAME extends HTMLElementTagName ? HTMLElementTagNameMap[TAG_NAME] :
  TAG_NAME extends SVGElementTagName ?  SVGElementTagNameMap[TAG_NAME] : never;
  
export class HtmlElementEvents<
  K extends ElementTagName
> {
  constructor (
    private component: any,
  ) {}
  #instantiatedEvents = new Map<Parameters<Element<K>["addEventListener"]>[0], ComponentEvent<any, any>>();

  public readonly getEvent = <
    KEY extends keyof HTMLElementEventMap// Parameters<HTMLElementTagNameMap[K]["addEventListener"]>[0]
  >(eventType: KEY) => {
    if (!this.#instantiatedEvents.has(eventType)) {
      const event = new ComponentEvent<[any], any>(this.component);
      this.#instantiatedEvents.set(eventType, event);
      this.component.primaryElement.addEventListener(eventType, event.send);
    }
    return this.#instantiatedEvents.get(eventType)! as unknown as ComponentEvent<[WindowEventMap[KEY & keyof WindowEventMap]], any>;
  }

  public get click() { return this.getEvent("click") }
  public get keydown() { return this.getEvent("keydown") }
  public get keyup() { return this.getEvent("keyup") }
  public get change() { return this.getEvent("change") }
}

export class Attributes<
  K extends ElementTagName = ElementTagName
> {
  name?: string;
  id?: string;
  text?: string;
  class?: string | string[];
  style?: string;
  value?: string;
  label?: string;
  events?: (events: HtmlElementEvents<K>) => any;
  onExceptionEvent?: (error: Error, extraInfo?: string) => void;
}

export const DefaultComponentAttributesToCopy : (string & keyof Attributes)[] =
  ["id", "name", "style"]
;

export class Component<
  OPTIONS extends Attributes = Attributes,
//  PRIMARY_ELEMENT extends HTMLOrSVGElement = HTMLOrSVGElement // extends HTMLElement | SVGElement = HTMLElement | SVGElement
  PRIMARY_ELEMENT_TAG_NAME extends ElementTagName = ElementTagName // extends HTMLElement | SVGElement = HTMLElement | SVGElement
> {
  #removed = false;
  public get removed(): boolean { return this.#removed; }
  detachEvent = new ComponentEvent(this);
  public exceptionEvent = new ComponentEvent<[Error, string?], this>(this);
  
  childComponents = new Set<Component>();

  private static uniqueElementIdCounter: number = 0;

  /**
   * Generate a unique ID for a node
   * @param nonUniqueName
   */
  uniqueNodeId = (nonUniqueName: string = "id"): string =>
    `${nonUniqueName}::${(Component.uniqueElementIdCounter++).toString()}`;

  public readonly events: HtmlElementEvents<PRIMARY_ELEMENT_TAG_NAME>;

  constructor(
    public readonly options: OPTIONS,
    public readonly primaryElement: Element<PRIMARY_ELEMENT_TAG_NAME> = document.createElement("div") as unknown as Element<PRIMARY_ELEMENT_TAG_NAME>,
    attributesToCopy: (string & keyof OPTIONS)[] = []
  ) {
    this.detachEvent.on(() => this.remove());
    if (options.onExceptionEvent) {
      this.exceptionEvent.on(options.onExceptionEvent);
    }
    this.events = new HtmlElementEvents(this);
    this.options.events?.(this.events);
    const {text, class: classes} = this.options;
    const setOfAllAttributesToCopy = new Set<(string & keyof OPTIONS)>([...DefaultComponentAttributesToCopy, ...attributesToCopy]);
    for (const key of setOfAllAttributesToCopy) {
      if (key === "class" || key === "text") {
        // Classes are a special case
        continue;
      }
      const val = options[key];
      if (typeof val === "string") {
        this.primaryElement.setAttribute(key, val);
      }
    }
    // Give the object a class for each class it belongs to
    // for (var obj: object | undefined = this; obj != null; obj = (obj as {super?: object}).super) {
    //   this.addClass(obj.constructor.name)
    // }
    const nameOfDescendantClass = this.constructor.name;
    if (nameOfDescendantClass != "HtmlElement") {
      this.addClass(nameOfDescendantClass);
    }
    if (typeof text === "string" && this.primaryElement.textContent != null) {
      this.primaryElement.textContent = text;
    }
    if (classes != null) {
      this.addClass(...(
        typeof classes === "string" ?
          [classes] :
        Array.isArray(classes) ?
          [...classes] :
          []
      ));
    }
    this.renderSoon();
  }

  protected parentComponent?: Component;
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
  render(...appendable: Appendable[]): void | Promise<void> {
    this.clear();
    this.append(appendable);
  }

  private renderTimeout?: number | NodeJS.Timeout;
  /**
   * Kick off an element render operation soon
   * (but not immediately, as constructors may need to finish first)
   */
  renderSoon = () => {
    if (typeof this.renderTimeout !== "undefined" || this.#removed) {
      return;
    }
    this.renderTimeout = setTimeout( () => {
      try {
        if (!this.#removed) {
          this.render();
        }
      } finally {
        this.renderTimeout = undefined;
      }
    }, 1);
  }

  remove(): boolean {
    if (this.#removed) {
      // No need to remove, so return false
      return false;
    }
    // Make sure we only remove once;
    this.#removed = true;
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

  protected trackChild = (child: Component) => {
    this.childComponents.add(child);
  }

  protected removeChild = (child: Component): boolean => {
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
  appendChild<HTML_COMPONENT extends Component>(
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
      } else if (child instanceof Component) {
        this.appendChild(child);
      } else {
        this.primaryElement.append(child);
      }
    }
    return this;
  }

  setInnerText(text: string) {
    this.primaryElement.textContent = text;
    return this;
  }
  
  with = (callback: (t: this) => any): this => {
    callback(this);
    return this;
  }

  withElement = (callback: (t: Element<PRIMARY_ELEMENT_TAG_NAME>) => any): this => {
    callback(this.primaryElement);
    return this;
  }

  addClass = (...classes: string[]): this => {
    this.primaryElement?.classList.add(...classes);
    return this;
  }

  removeClass = (...classes: string[]): this => {
    this.primaryElement?.classList.remove(...classes);
    return this;
  }

  /**
   * Create a child element that can be replaced
   */
  replaceableChild = <HTML_COMPONENT extends Component>(): ReplaceableChild<HTML_COMPONENT> => {
    var current: HTML_COMPONENT | undefined = undefined;

    const replace = <ACTUAL_HTML_COMPONENT extends HTML_COMPONENT = HTML_COMPONENT>(
      child: ACTUAL_HTML_COMPONENT
    ): ACTUAL_HTML_COMPONENT => {
      // if (child == null) {
      //   if (oldChild) {
      //     oldChild.remove();
      //   }
      //   return child;
      // }
      if (current != null && current.primaryElement.parentNode != null && this.childComponents.has(current)) {
        current.primaryElement.replaceWith(child.primaryElement);
        current.remove();
      } else {
        this.primaryElement.appendChild(child.primaryElement);
      }
      this.trackChild(child);
      child.parentComponent = this;
      current = child;
      return child;
    }
    return replace;
  }

  
  /**
   * Throw exceptions that can be passed up to parent components
   *
   * @param exception 
   */
  protected throwException = (e: unknown, extraInfo?: string) => {
    if (e instanceof Error) {
      if (!e.stack || e.stack.length == 0) {
        try {
          throw new Error("Get me a stack!");
        } catch (errorWhichHopefullyHasStack) {
          e.stack = errorWhichHopefullyHasStack.stack;
        }
      }
      this.exceptionEvent.send(e, extraInfo);
    } else {
      try {
        throw new Error(typeof e === "string" ? e : JSON.stringify(e))
      } catch (exception) {
        this.exceptionEvent.send(exception as Error, extraInfo)
      }
    }
  }
}
export interface ReplaceableChild<HTML_COMPONENT extends Component> {
  (child: HTML_COMPONENT): HTML_COMPONENT
}