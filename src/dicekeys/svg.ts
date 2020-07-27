const createSvgElement = <TAG extends keyof SVGElementTagNameMap>(
  tag: TAG
) => (
  attributes: {[name: string]: string | number} = {},
  ...children: SVGElement[]
): SVGElementTagNameMap[TAG] => {
  const newElement = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) {
    newElement.setAttribute(key, typeof value === "string" ? value : value.toString() );
  }
  newElement.append(...children);
  return newElement;
}

export const circle = createSvgElement('circle');
export const g = createSvgElement('g');
export const rect = createSvgElement('rect');
export const svg = createSvgElement('svg');
export const text = createSvgElement('text');
export const tspan = (text: string) => {
  const e = createSvgElement('tspan')();
  e.textContent = text;
  return e;
};
