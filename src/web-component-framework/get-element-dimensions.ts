
const category = ["margin", "border", "padding"];
const heightStyles = ["height"].concat(...(category.map( c => ["top", "bottom"].map( edge => `${c}-${edge}` ))));
const widthStyles  = ["width"].concat(...(category.map( c => ["left", "right"].map( edge => `${c}-${edge}` ))));

export const getElementDimensions = (htmlElement: HTMLElement) => {
  const style = window.getComputedStyle(htmlElement);
  const height = heightStyles
    .map((key) => parseInt(style.getPropertyValue(key), 10))
    .reduce((prev, cur) => prev + cur);
  const width = widthStyles
    .map((key) => parseInt(style.getPropertyValue(key), 10))
    .reduce((prev, cur) => prev + cur);
  return {height, width};
}