import styles from "./add-password-domain.module.css"
import {
  Attributes,
  Component,
  Label,
  Span,
  TextInput,
  ComponentEvent, Div, Button, Checkbox
} from "../../web-component-framework";

import { getRegisteredDomain } from "~domains/get-registered-domain";
import { addStoredPasswordConsumer, PasswordConsumerType, passwordDerivationOptionsJson } from "~dicekeys/password-consumers";
import { FavIcon } from "./fav-icon";
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";

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
  domainFieldEditAllowedCheckbox?: Checkbox;
  get derivedDomain(): string { return this.derivedDomainInputField?.value ?? ""; }
  derivationOptionsJsonField?: TextInput;
  derivationOptionsJsonEditAllowedCheckbox?: Checkbox;
  get derivationOptionsJson(): string { return this.derivationOptionsJsonField?.value ?? ""; }
  imageContainerDiv?: Div;
  nameField?: TextInput;
  nameFieldEditAllowedCheckbox?: Checkbox;
  get name(): string { return this.nameField?.value ?? ""; }
  addButton?: HTMLButtonElement;

  faviconImage?: HTMLImageElement;

  private disableUnlessChecked = (fieldToDisable: TextInput, checkbox: Checkbox) => {
    if (checkbox.checked) {
      fieldToDisable.primaryElement.removeAttribute("disabled");
    } else {
      fieldToDisable.primaryElement.setAttribute("disabled", "");
    }
  }



  private deriveDomainField = () => {
    if (this.derivedDomainInputField && !this.domainFieldEditAllowedCheckbox?.checked) {
      const registeredDomain = getRegisteredDomain(this.domainOrUrlInputField?.value ?? "");
      if (registeredDomain == null || registeredDomain.length == 0) return;
      this.derivedDomainInputField.value = registeredDomain;
    }
  }

  private deriveDerivationOptionsJsonField = () => {
    if (this.derivationOptionsJsonField && !this.derivationOptionsJsonEditAllowedCheckbox?.checked) {
      this.derivationOptionsJsonField.value = passwordDerivationOptionsJson(this.derivedDomain);
    }
  }

  private deriveNameField = () => {
    if (this.nameField && !this.nameFieldEditAllowedCheckbox?.checked) {
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

  // private handleRegisteredDomainChanged = () => {
  //   this.deriveDerivationOptionsJsonField();

  //   if (!this.nameFieldManual?.checked) {
  //     this.nameField!.value = 
  //       (this.derivedDomain.split(".")[0]?.charAt(0) ?? "").toLocaleUpperCase() +
  //       (this.derivedDomain.split(".")[0]?.substr(1) ?? "")

  //     try{
  //       if (this.name.length > 0 && this.derivationOptionsJson.length > 0 && DerivationOptions(this.derivationOptionsJson)) {
  //         this.addButton?.removeAttribute("disabled");
  //       }
  //     } catch {
  //       // Do nothing if there was an exception calculation the derivation options.
  //     }

  //     this.imageContainerDiv?.clear();
  //     this.imageContainerDiv?.append(
  //       new FavIcon({domain: this.derivedDomain})
  //     )
  //   }
  // }

  render() {
    super.render();
    this.append(
      Label({},
        Span({},"Domain or URL of the application/service you need a password for"),
        TextInput().with( e => {
          this.domainOrUrlInputField = e;
          e.events.change.on(this.deriveDomainField);
          e.events.keyup.on(this.deriveDomainField);
      })),
      Label({},
        Span({},"Service Domain"),
        TextInput({disabled: ""}).with( e => {
          this.derivedDomainInputField = e;
          e.events.keyup.on(this.deriveDerivationOptionsJsonField, this.deriveNameField, this.deriveImage, this.updateSubmitButtonState);
          e.events.change.on(this.deriveDerivationOptionsJsonField, this.deriveNameField, this.deriveImage, this.updateSubmitButtonState);

        }),
        Label({},
          Span({}, "Set manually"),
          Checkbox({}, ).with( e => {
            this.domainFieldEditAllowedCheckbox = e;
            e.events.click.on( () => { this.disableUnlessChecked(this.derivedDomainInputField!, e)})
          } )
        ),
      ),
      Label({},
        Span({},"Password derivation options"),
        TextInput({disabled: ""}).with( e => {
          this.derivationOptionsJsonField = e;
          e.events.keyup.on(this.updateSubmitButtonState);
          e.events.change.on(this.updateSubmitButtonState);
       }),
       Label({},
        Span({}, "Set manually"),
        Checkbox({}, ).with( e => {
          this.derivationOptionsJsonEditAllowedCheckbox = e;
          e.events.click.on( () => { this.disableUnlessChecked(this.derivationOptionsJsonField!, e)})
        } )
      ),
      ),
      Div({}).with( div => this.imageContainerDiv = div ),
      Label({},
        Span({},"Name"),
        TextInput({disabled: ""}).with( e => {
          this.nameField = e;
        }),
        Label({},
          Span({}, "Set manually"),
          Checkbox({}, ).with( e => {
            this.domainFieldEditAllowedCheckbox = e;
            e.events.click.on( () => { this.disableUnlessChecked(this.nameField!, e)})
          } )        )
      ),
      Button({value: "Cancel"}, "Cancel").with( e => {
        e.events.click.on( this.complete.send )
      }),
      Button({value: "Add", disabled: ""}, "Add").with( e => {
        this.addButton = e.primaryElement;
        e.events.click.on( this.add )
      }),
    );
  }

}
