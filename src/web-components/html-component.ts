export  interface HtmlComponentConstructorOptions {
  containerElement?: HTMLElement;  
  nodeToInsertThisComponentBefore?: Node | null
}

export class HtmlComponent {
  public readonly containerElement: HTMLElement;  

  constructor(
    protected parentElement: HTMLElement,
    html: string,
    protected readonly options: HtmlComponentConstructorOptions = {}
  ) {
    const {
      containerElement = document.createElement("div"),
      nodeToInsertThisComponentBefore = null
    } = options;
    this.containerElement = containerElement;
    this.containerElement.innerHTML = html;
    this.parentElement.insertBefore(this.containerElement, nodeToInsertThisComponentBefore);
  }

  public destroy() {
    this.parentElement.removeChild(this.containerElement);
  }

}