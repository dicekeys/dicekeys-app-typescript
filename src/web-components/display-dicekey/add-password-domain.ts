import styles from "./add-password-domain.module.css";
import dialogStyles from "../dialog.module.css";
import layoutStyles from "../layout.module.css";
import {
  Attributes,
  Component,
  Label,
  Span,
  TextInput,
  ComponentEvent, Div, Button
} from "../../web-component-framework";

import { getRegisteredDomain } from "~domains/get-registered-domain";
import { addStoredPasswordConsumer, PasswordConsumerType, passwordDerivationOptionsJson } from "~dicekeys/password-consumers";
import { FavIcon } from "./fav-icon";
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";

export interface AddPasswordDomainOptions extends Attributes {}

export class AddPasswordDomain extends Component<AddPasswordDomainOptions> {

  /**
   * The code supporting the demo page cannot load until the WebAssembly module for the image
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

  add = () => {
    if (!this.isValidToSubmit) return;
    addStoredPasswordConsumer({
      type: PasswordConsumerType.UserEntered,
      name: this.name,
      derivationOptionsJson: this.derivationOptionsJson
    });
    this.complete.send();
  }

  domainOrUrlInputField?: TextInput;
  get domainOrUrl(): string { return this.domainOrUrlInputField?.value ?? ""; }
  derivedDomainInputField?: TextInput;
  get derivedDomain(): string { return this.derivedDomainInputField?.value ?? ""; }
  derivationOptionsJsonField?: TextInput;
  get derivationOptionsJson(): string { return this.derivationOptionsJsonField?.value ?? ""; }
  imageContainerDiv?: Div;
  nameField?: TextInput;
  get name(): string { return this.nameField?.value ?? ""; }
  addButton?: HTMLButtonElement;

  faviconImage?: HTMLImageElement;

  private deriveDomainField = () => {
    if (this.derivedDomainInputField && this.derivedDomainInputField.primaryElement.disabled) {
      const registeredDomain = getRegisteredDomain(this.domainOrUrlInputField?.value ?? "");
      if (registeredDomain == null || registeredDomain.length == 0) return;
      this.derivedDomainInputField.value = registeredDomain;
    }
  }

  private deriveDerivationOptionsJsonField = () => {
    if (this.derivationOptionsJsonField && this.derivationOptionsJsonField.primaryElement.disabled) {
      this.derivationOptionsJsonField.value = passwordDerivationOptionsJson(this.derivedDomain);
    }
  }

  private deriveNameField = () => {
    if (this.nameField && this.nameField.primaryElement.disabled) {
      this.nameField.value = 
        (this.derivedDomain.split(".")[0]?.charAt(0) ?? "").toLocaleUpperCase() +
        (this.derivedDomain.split(".")[0]?.substr(1) ?? "");
    }
  }

  private get isValidToSubmit() {
    try{
      return (
        this.name.length > 0 &&
        this.derivationOptionsJson.length > 0 &&
        DerivationOptions(this.derivationOptionsJson)
      );
    } catch {
      // Derivation options aren't valid and threw exception
      return false;
    }
  }

  private updateSubmitButtonState = () => {
    if (this.isValidToSubmit) {
      this.addButton?.removeAttribute("disabled");
    } else {
      this.addButton?.setAttribute("disabled", "");
    }
  }

  private deriveImage = () => {
    this.imageContainerDiv?.clear();
    this.imageContainerDiv?.append(
      new FavIcon({domain: this.derivedDomain})
    );
  }


  render() {
    super.render();
    this.addClass(layoutStyles.stretched_column_container)
    this.append(
      Div({class: dialogStyles.instructions ,text: `You can fill in all the options simply by pasting the URL of the service you need a password for into the first field.`}),
      Label({class: styles.item_label},
        Span({class: styles.label_span},"Enter the domain name or HTTPS URL of the application/service the password is for:"),
        Div({style: "display: flex; flex-direction: row"},
          TextInput({class: styles.text_box, style: "display: flex;"}).with( e => {
            this.domainOrUrlInputField = e;
            e.events.change.on(this.deriveDomainField);
            e.events.keyup.on(this.deriveDomainField);
          }),
          Div({style: "display: flex;"}).with( div => this.imageContainerDiv = div ),
        )
      ),
      Label({class: styles.item_label},
        Span({class: styles.label_span},"The domain name with which this password may be shared:"),
        TextInput({class: styles.text_box, disabled: ""}).with( e => {
          this.derivedDomainInputField = e;
          e.events.keyup.on(this.deriveDerivationOptionsJsonField, this.deriveNameField, this.deriveImage, this.updateSubmitButtonState);
          e.events.change.on(this.deriveDerivationOptionsJsonField, this.deriveNameField, this.deriveImage, this.updateSubmitButtonState);
        }),
        Span({class: styles.write_icon}).with( e => e.events.click.on( () => {
          this.derivedDomainInputField!.primaryElement.disabled = !this.derivedDomainInputField!.primaryElement.disabled;
          this.deriveDomainField();
        })),
      ),
      Label({class: styles.item_label},
        Span({class: styles.label_span},"JSON formatted password derivation options:"),
        TextInput({class: styles.text_box, disabled: ""}).with( e => {
          this.derivationOptionsJsonField = e;
          e.events.keyup.on(this.updateSubmitButtonState);
          e.events.change.on(this.updateSubmitButtonState);
        }),
        Span({class: styles.write_icon}).with( e => e.events.click.on( () => {
          this.derivationOptionsJsonField!.primaryElement.disabled = !this.derivationOptionsJsonField!.primaryElement.disabled;
          this.deriveDerivationOptionsJsonField();
        })),
      ),
      Label({},
        Span({class: styles.label_span},"The name of this type of password (to appear in the passwords-generation menu):"),
        TextInput({class: styles.text_box, disabled: ""}).with( e => {
          this.nameField = e;
        }),
        Span({class: styles.write_icon}).with( e => e.events.click.on( () => {
          this.nameField!.primaryElement.disabled = !this.nameField!.primaryElement.disabled;
          this.deriveNameField();
        }))
      ),
      Div({class: dialogStyles.decision_button_container},
        Button({value: "Cancel"}, "Cancel").with( e => {
          e.events.click.on( this.complete.send )
        }),
        Button({value: "Add", disabled: ""}, "Add").with( e => {
          this.addButton = e.primaryElement;
          e.events.click.on( this.add )
        }),
      )
    );
  }

}
