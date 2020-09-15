import {
  Attributes,
  Component,
  Img,
  Div
} from "../../web-component-framework";


export interface FavIconOptions extends Attributes {
  domain: string | string[]
}

export class FavIcon extends Component<FavIconOptions> {

  imageContainerDiv?: Div;
  faviconImage?: HTMLImageElement;

  render() {
    const firstDomain = Array.isArray(this.options.domain) ? this.options.domain[0] : this.options.domain;
    super.render();
    this.append(
      Div({},
        Img({src: `https://${firstDomain}/favicon.ico`, style: `height: 1.25rem; width: 1.25rem`}).withElement (img => {
          this.faviconImage = img;
          img.addEventListener("error", () => img.style.setProperty("visibility", "hidden"));
        })).with( div => this.imageContainerDiv = div )
    );
  }

}