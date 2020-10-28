import {
  Component,
  Appendable, SVGElementTagName, Element
} from "./web-component";

type Attributes<TAG extends SVGElementTagName> = {[key in keyof SVGElementTagNameMap[TAG]]?: string | number | undefined}


class SvgElement<
  TAG extends SVGElementTagName,
> extends Component<{}, TAG> {

constructor(
  tagName: TAG,
  attributes?: Attributes<TAG>,
  ...children: Appendable[]
) {
  const newElement = document.createElementNS("http://www.w3.org/2000/svg", tagName) as Element<TAG>;
  for (const [key, value] of Object.entries(attributes ?? {})) {
    if (value != null) {
      newElement.setAttribute(key, typeof value === "string" ? value : value.toString() );
    }
  }
  super(attributes ?? {} as SVGElementTagNameMap[TAG], newElement);
  this.append(...children);
}

public static create = <
  TAG extends SVGElementTagName = SVGElementTagName
>(
  tagName: TAG
) => (
  attributes?: Attributes<TAG>,
  ...appendable: Appendable[]
) =>
  new SvgElement<TAG>(tagName, attributes).append(...appendable);

render() {
  // no-op to prevent super from getting called and erasing static content
}

}


const createSvgElement = <TAG extends keyof SVGElementTagNameMap>(
  tag: TAG
) => (
  attributes?: Attributes<TAG>,
  ...children: Appendable[]
): SvgElement<TAG> => {
  return new SvgElement(tag, attributes, ...children);
  // const newElement = document.createElementNS("http://www.w3.org/2000/svg", tag);
  // for (const [key, value] of Object.entries(attributes)) {
  //   newElement.setAttribute(key, typeof value === "string" ? value : value.toString() );
  // }
  // newElement.append(...children);
  // return 
  // return newElement;
}

export const circle = createSvgElement('circle');
export const g = createSvgElement('g');
export const rect = createSvgElement('rect');
export const svg = createSvgElement('svg');
export type svg = ReturnType<typeof svg>;
export const text = createSvgElement('text');
export const tspan = (text: string) => {
  const e = createSvgElement('tspan')();
  e.textContent = text;
  return e;
};
