import {
  HtmlComponent
} from "./html-component";
import { ComponentEvent } from "./component-event";

export class Attributes {
  class?: string | string[];
  style?: string;
  text?: string;
}

class HtmlElement<
  K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
  OPTIONS extends Attributes = Attributes
> extends HtmlComponent<Partial<OPTIONS>, HTMLElementTagNameMap[K]> {

  constructor(tagName: K, options?: OPTIONS) {
    super(options ?? {}, document.createElement(tagName));
    const {text, style} = this.options;
    if (this.options.class) {
      const classes: string[] = Array.isArray(this.options.class) ? [...this.options.class] : [this.options.class];
      this.primaryElement.classList.add(...classes);
    }
    if (typeof style === "string") {
      this.primaryElement.setAttribute("style", style);
    }
    if (typeof text === "string" && this.primaryElement.innerText != null) {
      this.primaryElement.innerText = text;
    }
  }

  public static create = <
    K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
    OPTIONS extends Attributes = Attributes
  >(tagName: K) => (options?: OPTIONS) => new HtmlElement<K, OPTIONS>(tagName, options);

  render() {
    // no-op to prevent super from getting called and erasing static content
  }

  with = (callback: (t: this) => any): this => {
    callback(this);
    return this;
  }

  withElement = (callback: (t: HTMLElementTagNameMap[K]) => any): HtmlElement<K, OPTIONS> => {
    callback(this.primaryElement);
    return this;
  }
}


interface CreateOrWith<
  ELEMENT extends HtmlElement<K, OPTIONS>,
  K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
  OPTIONS extends Attributes = Attributes
> {
  (options?: OPTIONS): ELEMENT;
  with: (callback: (t: ELEMENT) => any) => CreateOrWith<ELEMENT, K, OPTIONS>
}

const htmlElementFactory = <
  ELEMENT extends HtmlElement<K, OPTIONS>,
  K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
  OPTIONS extends Attributes = Attributes,
>(
  creator: (options?: OPTIONS) => ELEMENT
): CreateOrWith<ELEMENT, K, OPTIONS> => {
  const create = (): CreateOrWith<ELEMENT, K, OPTIONS> => {
    const withFn = (callback: (t: ELEMENT) => any) => {
      const createFn = create();
      const createThenCallWithCallback: CreateOrWith<ELEMENT, K, OPTIONS> = (options?: OPTIONS) => {
        const result = createFn(options);
        callback(result);
        return result;
      }
      createThenCallWithCallback.with = withFn;
      return createThenCallWithCallback;
    }
    // At the bottom of the recursion chain is a create
    // that doesn't have with
    const createWithoutWith: CreateOrWith<ELEMENT, K, OPTIONS> = (options?: OPTIONS) => creator(options)
    // Turn the create without with into one with with
    // before returning.
    createWithoutWith.with = withFn;
    return createWithoutWith;
  }
  return create();
}


const createHtmlElement = <
  K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
  OPTIONS extends Attributes = Attributes
>(tag: K): CreateOrWith<HtmlElement<K, OPTIONS>, K, OPTIONS> => {
  return htmlElementFactory<HtmlElement<K, OPTIONS>, K, OPTIONS>(
    HtmlElement.create<K, OPTIONS>(tag)
  );// (options?: OPTIONS) => new HtmlElement<K, OPTIONS>(tag, options) );
  // const create = (): CreateOrWith<K, OPTIONS> => {
  //   const withFn = (callback: (t: HtmlElement<K, OPTIONS>) => any) => {
  //     const createFn = create();
  //     const createThenCallWith = (options?: OPTIONS) => {
  //       const result = createFn(options);
  //       result.with(callback);
  //       return result;
  //     }
  //     createThenCallWith.with = withFn;
  //     return createThenCallWith;
  //   }
  //   // At the bottom of the recursion chain is a create
  //   // that doesn't have with
  //   const createWithoutWith = (options?: OPTIONS) =>
  //     new HtmlElement<K, OPTIONS>(tag, options);
  //   // Turn the create without with into one with with
  //   // before returning.
  //   createWithoutWith.with = withFn;
  //   return createWithoutWith;
  // }
  // return create();
}


type InputType = "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week";
interface InputAttributes extends Attributes {
  type: InputType
}
class InputElement<
  OPTIONS extends InputAttributes = InputAttributes
> extends HtmlElement<"input", OPTIONS> {
  constructor(type: InputType, options?: OPTIONS) {
    super("input", options);
    this.primaryElement.setAttribute("type", type);
    this.primaryElement.addEventListener("change", (e) => this.changed.send(e) );
    this.primaryElement.addEventListener("keyup", (e) => this.changed.send(e) );
  }
  public get value() { return this.primaryElement.value }
  public set value(value: string) { this.primaryElement.value = value }
  public readonly changed = new ComponentEvent<[Event]>(this);
}
/*
<
  // TYPE extends InputType = InputType
  // OPTIONS extends InputAttributes = InputAttributes
>*/
export const Input = <
  OPTIONS extends InputAttributes = InputAttributes
>(type: InputType) =>
  htmlElementFactory<InputElement<OPTIONS>, "input", OPTIONS>(
    (options?: OPTIONS) => new InputElement<OPTIONS>(type, options)
  )
  export type Input = ReturnType<typeof Input>;


export class CheckboxElement<
  OPTIONS extends InputAttributes = InputAttributes
> extends InputElement<OPTIONS> {
  constructor(options?: OPTIONS) {
    super("checkbox", options);
    this.primaryElement.setAttribute("type", "checkbox");
  }
  public get checked() { return this.primaryElement.checked }
  public set checked(value: boolean) { this.primaryElement.checked = value }
}

export const TextInput = Input("text");
export type TextInput = ReturnType<typeof TextInput>;

export const Checkbox = htmlElementFactory(
  (options?: InputAttributes) => new CheckboxElement(options)
)
export type Checkbox = ReturnType<typeof Checkbox>;

export const H1 = createHtmlElement("h1");
export const H2 = createHtmlElement("h2");
export const H3 = createHtmlElement("h3");
export const Div = createHtmlElement("div");
export type Div = ReturnType<typeof Div>;
export const Span = createHtmlElement("span");
export const MonospaceSpan = Span.with( e => e.primaryElement.style.setProperty("font-family", "monospace") );
export type Span = ReturnType<typeof Span>;
export const Canvas = createHtmlElement("canvas");
export type Canvas = ReturnType<typeof Canvas>;

export const Label = createHtmlElement("label");
export type Label = ReturnType<typeof Label>;

interface VideoAttributes extends Attributes {
}
export const Video = createHtmlElement<"video", VideoAttributes>("video").with( e => {
  e.primaryElement.setAttribute("controls","");
  e.primaryElement.setAttribute("autoplay","");
});
export type Video = ReturnType<typeof Video>;
