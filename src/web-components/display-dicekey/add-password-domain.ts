import styles from "./add-password-domain.module.css"
import {
  Attributes,
  Component,
  Label,
  Span,
  TextInput,
  Img, ComponentEvent
} from "../../web-component-framework";
import { getRegisteredDomain } from "~domains/get-registered-domain";

const domainRegexp = new RegExp("(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]");
const isValidDomain = (candidate: string): boolean => domainRegexp.test(candidate);


export interface AddPasswordDomainOptions extends Attributes {}

export class AddPasswordDomain extends Component<AddPasswordDomainOptions> {

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: AddPasswordDomainOptions
  ) {
      super(options);
      this.addClass(styles.add_password_domain);
  }

  public complete = new ComponentEvent<[]>(this);

  domainOrUrlInputField?: TextInput;
  get domainOrUrl(): string { return this.domainOrUrlInputField?.value ?? ""; }
  derivedDomainInputField?: TextInput;
  get derivedDomain(): string { return this.derivedDomainInputField?.value ?? ""; }
  faviconImage?: HTMLImageElement;


  private handleDomainOrUrlFieldChanged = () => {
    const domain = this.domainOrUrlInputField?.value ?? "";
    if (isValidDomain(domain)) {
      this.derivedDomainInputField!.value = getRegisteredDomain(domain);
    }
  }

  private handleRegisteredDomainChanged = () => {
    const newSrc = `https://${this.derivedDomain}/favicon.ico`;
    if (this.faviconImage != null && newSrc != this.faviconImage.src) {
      this.faviconImage.setAttribute("display", "none");
      this.faviconImage.src = `https://${this.derivedDomain}/favicon.ico`;
      this.faviconImage.addEventListener("load", () => this.faviconImage?.setAttribute("display", "block"));
    }
  }

  render() {
    super.render();
    this.append(
      Label({},
        Span({},"Domain or URL"),
        TextInput().with( e => {
          this.domainOrUrlInputField = e;
          e.events.change.on(this.handleDomainOrUrlFieldChanged);
          e.events.keyup.on(this.handleDomainOrUrlFieldChanged);
        }),
      Label({},
        Span({},"Derived Domain"),
        TextInput({disabled: ""}).with( e => {
          this.derivedDomainInputField = e;
          e.events.change.on(this.handleRegisteredDomainChanged);
        }),
      ),
      Img({style: "display: none"}).withElement( e => this.faviconImage = e ))
    );
  }

}
