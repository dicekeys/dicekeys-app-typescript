import styles from "./add-password-domain.module.css"
import {
  Attributes,
  Component,
  Label,
  Span,
  TextInput,
  ComponentEvent, Div
} from "../../web-component-framework";

import { getRegisteredDomain } from "~domains/get-registered-domain";
import { passwordDerivationOptionsJson } from "~dicekeys/password-consumers";
import { FavIcon } from "./fav-icon";

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
  derivationOptionsField?: TextInput;
  get derivationOptions(): string { return this.derivationOptionsField?.value ?? ""; }
  imageContainerDiv?: Div;
  nameField?: TextInput;
  get name(): string { return this.nameField?.value ?? ""; }


  faviconImage?: HTMLImageElement;


  private handleDomainOrUrlFieldChanged = () => {
    const domain = this.domainOrUrlInputField?.value ?? "";
    if (isValidDomain(domain)) {
      this.derivedDomainInputField!.value = getRegisteredDomain(domain);
      this.handleRegisteredDomainChanged();
    }
  }

  private handleRegisteredDomainChanged = () => {
    this.derivationOptionsField!.value = passwordDerivationOptionsJson(this.derivedDomain);
    this.nameField!.value = 
      (this.derivedDomain.split(".")[0]?.charAt(0) ?? "").toLocaleUpperCase() +
      (this.derivedDomain.split(".")[0]?.substr(1) ?? "")

    this.imageContainerDiv?.clear();
    this.imageContainerDiv?.append(
      new FavIcon({domain: this.derivedDomain})
    )
  }

  render() {
    super.render();
    this.append(
      Label({},
        Span({},"Domain or URL of the application/service you need a password for"),
        TextInput().with( e => {
          this.domainOrUrlInputField = e;
          e.events.change.on(this.handleDomainOrUrlFieldChanged);
          e.events.keyup.on(this.handleDomainOrUrlFieldChanged);
      })),
      Label({},
        Span({},"Service Domain"),
        TextInput({disabled: ""}).with( e => {
          this.derivedDomainInputField = e;
          e.events.change.on(this.handleRegisteredDomainChanged);
      })),
      Label({},
        Span({},"Password derivation options"),
        TextInput({disabled: ""}).with( e => {
          this.derivationOptionsField = e;
          e.events.change.on(this.handleRegisteredDomainChanged);
      })),
      Div({}).with( div => this.imageContainerDiv = div ),
      Label({},
        Span({},"Name"),
        TextInput({disabled: ""}).with( e => {
          this.nameField = e;
      })),
    );
  }

}
