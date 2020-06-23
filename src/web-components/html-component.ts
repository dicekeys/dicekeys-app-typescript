import {
  ComponentEvent
} from "./component-event";

export class HtmlComponent<
  OPTIONS extends object = object,
  TOP_LEVEL_ELEMENT extends HTMLElement = HTMLElement  
> {
  detachEvent = new ComponentEvent(this);
  childComponents = new Set<HtmlComponent>();

  constructor(
    public readonly options: OPTIONS,
    public readonly parentComponent?: HtmlComponent,
    public readonly primaryElement: TOP_LEVEL_ELEMENT = document.createElement("div") as unknown as TOP_LEVEL_ELEMENT,
  ) {
    this.detachEvent.on(() => this.remove());
    parentComponent?.addChild(this);
    this.renderSoon();
  }

  clear() {
    // while (this.primaryElement.children.length > 0) {
    //   this.primaryElement.removeChild(this.primaryElement.children[0]);
    // }
    this.primaryElement.innerHTML = "";
    this.removeAllChildren();
  }

  render() {
    this.clear();
  }

  private renderTimeout?: number | NodeJS.Timeout;
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
    this.parentComponent?.removeChild(this);
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

  addHtml(html: string) {
    this.primaryElement.innerHTML += html;
  }

  addChild<HTML_COMPONENT extends HtmlComponent>(
    child: HTML_COMPONENT
  ): HTML_COMPONENT {
    this.trackChild(child);
    this.primaryElement.appendChild(child.primaryElement);
    return child;
  }

}