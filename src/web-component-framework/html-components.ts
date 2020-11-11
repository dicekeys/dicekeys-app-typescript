import {
  Attributes,
  Component,
  Appendable, ElementTagName, Element
} from "./web-component";


type HtmlElementAttributes<
  K extends ElementTagName
> = Attributes<K> & {
  [attributeName in keyof (Element<K>)]?: string;
} & {
  value?: string;
  text?: string;
  label?: string;
}


class HtmlElement<
  K extends ElementTagName,// = keyof HTMLElementTagNameMap,
  OPTIONS extends HtmlElementAttributes<K> = HtmlElementAttributes<K>
> extends Component<OPTIONS, K> {
  // public readonly events: HtmlElementEvents<K>;

  constructor(
    tagName: K,
    options?: OPTIONS,
    // attributesToCopy: (string & keyof OPTIONS)[] = []
  ) {
    super(options ?? {} as OPTIONS, document.createElement(tagName) as Element<K>, Object.keys(options ?? {}) as (string & keyof OPTIONS)[] );
    // this.events = new HtmlElementEvents(this);
    // this.options.events?.(this.events);
  }

  public static create = <
    K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
    OPTIONS extends HtmlElementAttributes<K> = HtmlElementAttributes<K>
  >(
    tagName: K,
    // attributesToCopy: (string & keyof OPTIONS)[] = []
  ) => (options?: OPTIONS, ...appendable: Appendable<HtmlElement<K, OPTIONS>>[]) =>
    new HtmlElement<K, OPTIONS>(tagName, options).append(...appendable);

  render() {
    // no-op to prevent super from getting called and erasing static content
  }

}


interface CreateOrWith<
  ELEMENT extends HtmlElement<K, OPTIONS>,
  K extends ElementTagName = ElementTagName,
  OPTIONS extends HtmlElementAttributes<K> = HtmlElementAttributes<K>
> {
  (options?: OPTIONS, ...appendable: readonly Appendable[]): ELEMENT;
  with: (callback: (t: ELEMENT) => any) => CreateOrWith<ELEMENT, K, OPTIONS>
}

const htmlElementFactory = <
  ELEMENT extends HtmlElement<K, OPTIONS>,
  K extends ElementTagName = ElementTagName,
  OPTIONS extends HtmlElementAttributes<K> = HtmlElementAttributes<K>,
>(
  creator: (options?: OPTIONS, ...appendable: Appendable<ELEMENT>[]) => ELEMENT
): CreateOrWith<ELEMENT, K, OPTIONS> => {
  const create = (): CreateOrWith<ELEMENT, K, OPTIONS> => {
    const withFn = (callback: (t: ELEMENT) => any) => {
      const createFn = create();
      const createThenCallWithCallback: CreateOrWith<ELEMENT, K, OPTIONS> = (options?: OPTIONS, ...appendable: Appendable<ELEMENT>[]) => {
        const result = createFn(options);
        callback(result);
        result.append(appendable);
        return result;
      }
      createThenCallWithCallback.with = withFn;
      return createThenCallWithCallback;
    }
    // At the bottom of the recursion chain is a create
    // that doesn't have with
    const createWithoutWith: CreateOrWith<ELEMENT, K, OPTIONS> = (options?: OPTIONS, ...appendable: Appendable<ELEMENT>[]) => creator(options, appendable)
    // Turn the create without with into one with with
    // before returning.
    createWithoutWith.with = withFn;
    return createWithoutWith;
  }

  return create();
}


const createHtmlElement = <
  K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap,
  OPTIONS extends HtmlElementAttributes<K> = HtmlElementAttributes<K>
>(
  tag: K
): CreateOrWith<HtmlElement<K, OPTIONS>, K, OPTIONS> => {
  return htmlElementFactory<HtmlElement<K, OPTIONS>, K, OPTIONS>(
    HtmlElement.create<K, OPTIONS>(tag)
  );
}


type InputType = "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week";
type InputAttributes = HtmlElementAttributes<"input">;
class InputElement<
  OPTIONS extends InputAttributes = InputAttributes
> extends HtmlElement<"input", OPTIONS> {
  constructor(type: InputType, options?: OPTIONS) {
    super("input", options);
    this.primaryElement.setAttribute("type", type);
  }
  public get value() { return this.primaryElement.value }
  public set value(value: string) { 
    const valueChanged = this.primaryElement.value !== value;
    this.primaryElement.value = value;
    if (valueChanged) {
      this.primaryElement.dispatchEvent(new Event("change"));
    }
  }
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


export class CheckboxOrRadioButton extends InputElement<InputAttributes> {
  constructor(
    type: "checkbox" | "radio",
    options?: CheckboxOrRadioButton["options"]
  ) {
    super(type, options);
    this.primaryElement.checked = !!this.options.checked;
  }
  public get checked() { return this.primaryElement.checked }
  public set checked(value: boolean) { this.primaryElement.checked = value }
}


export const RawButton = createHtmlElement("button");
export const Button = ({onClick, ...options}: HtmlElementAttributes<"button"> & {onClick?: (mouseEvent: MouseEvent) => any}, ...appendable: Appendable[]) =>
  RawButton(options, ...appendable).with( e => {
    if (onClick) {
      e.events.click.on( onClick );
    }
  });
export type Button = ReturnType<typeof Button>;


export const TextInput = Input("text");
export type TextInput = ReturnType<typeof TextInput>;

export const InputButton =
  Input<InputAttributes & {
    clickHandler?: (e: MouseEvent)=>any
  }>("button").with( e => {
  if (e.options.clickHandler != null) {
    e.primaryElement.addEventListener("click", e.options.clickHandler );
  }
})
export type InputButton = ReturnType<typeof InputButton>;
export const TextArea = createHtmlElement("textarea");
export type TextArea = ReturnType<typeof TextArea>;

export const Checkbox = htmlElementFactory(
  (options?: CheckboxOrRadioButton["options"]) => new CheckboxOrRadioButton("checkbox", options)
)
export type Checkbox = ReturnType<typeof Checkbox>;

export const RadioButton = htmlElementFactory(
  (options?: CheckboxOrRadioButton["options"]) => new CheckboxOrRadioButton("radio", options)
)

export const Img = createHtmlElement<"img">("img");
export type Img = ReturnType<typeof Img>;

export type RadioButton = ReturnType<typeof RadioButton>;
export const H1 = createHtmlElement("h1");
export const H2 = createHtmlElement("h2");
export const H3 = createHtmlElement("h3");
export const OL = createHtmlElement("ol");
export const UL = createHtmlElement("ul");
export const LI = createHtmlElement("li");
export const Div = createHtmlElement("div");
export type Div = ReturnType<typeof Div>;
export const Span = createHtmlElement("span");
export const MonospaceSpan = Span.with( e => e.primaryElement.style.setProperty("font-family", "monospace") );
export type Span = ReturnType<typeof Span>;
export const Pre = createHtmlElement("pre");
export const Canvas = createHtmlElement("canvas");
export type Canvas = ReturnType<typeof Canvas>;
export const Select = createHtmlElement("select");
export type Select = ReturnType<typeof Select>;
export const Option = createHtmlElement("option");
export type Option = ReturnType<typeof Option>;
export const OptGroup = createHtmlElement("optgroup");
export type OptGroup = ReturnType<typeof OptGroup>;

export const HtmlObject = createHtmlElement("object");
export type HtmlObject = ReturnType<typeof HtmlObject>;

export const Label = createHtmlElement<"label", HtmlElementAttributes<"label"> & {for?: string}>("label");
export type Label = ReturnType<typeof Label>;

export const A = createHtmlElement("a");
export type A = ReturnType<typeof A>;


export const Video = createHtmlElement("video").with( e => {
  // e.primaryElement.setAttribute("controls","");
  e.primaryElement.setAttribute("autoplay","true");
});
export type Video = ReturnType<typeof Video>;


export class TextAreaAutoGrowElement extends HtmlElement<"textarea"> {
  
  constructor(options?: HtmlElementAttributes<"textarea">) {
    super("textarea", options);
    this.events.change.on( () => this.#resize() )
  }

  #resize = () => {
    this.primaryElement.style.height = 'auto';
    this.primaryElement.style.height = this.primaryElement.scrollHeight.toString() + 'px';
  }

  render() {
    super.render();
    this.#resize();
  }
}
export const TextAreaAutoGrow = (options?: HtmlElementAttributes<"textarea">) => new TextAreaAutoGrowElement(options);
export type TextAreaAutoGrow = typeof TextAreaAutoGrowElement;