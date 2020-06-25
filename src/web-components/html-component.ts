import {
  ComponentEvent
} from "./component-event";

export class HtmlComponent<
  OPTIONS extends object = object,
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
    public readonly options: OPTIONS,
    public readonly primaryElement: TOP_LEVEL_ELEMENT = document.createElement("div") as unknown as TOP_LEVEL_ELEMENT,
  ) {
    this.detachEvent.on(() => this.remove());
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
  renderSoon() {
    if (typeof this.renderTimeout !== "undefined") {
      return;
    }
    this.renderTimeout = setTimeout( () => {
      try {
        this.render();
      } finally {
        this.renderTimeout = undefined;
      }
    }, 1);
  }

  private alreadyRemoved = false;
  remove = (): boolean => {
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
  appendHtml(html: string) {
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
  }

  /**
   * Append a child component
   * 
   * @param child 
   */
  addChild<HTML_COMPONENT extends HtmlComponent>(
    child: HTML_COMPONENT
  ): HTML_COMPONENT {
    this.primaryElement.appendChild(child.primaryElement);
    this.trackChild(child);
    child.parentComponent = this;
    return child;
  }

  /**
   * Create a child ement that can be replaced
   */
  replaceableChild = <HTML_COMPONENT extends HtmlComponent>() => {
    var oldChild: HTML_COMPONENT | undefined = undefined;
    const replace = (
      child: HTML_COMPONENT
    ): HTML_COMPONENT => {
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