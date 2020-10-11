import styles from "./add-password-domain.module.css";
import dialogStyles from "../dialog.module.css";
import layoutStyles from "../layout.module.css";
import {
  Attributes,
  Component,
  Label,
  Span,
  ComponentEvent, Div, Button, Observable
} from "../../web-component-framework";

import { getRegisteredDomain } from "~domains/get-registered-domain";
import { addStoredPasswordConsumer, PasswordConsumerType, passwordDerivationOptionsJson } from "~dicekeys/password-consumers";
// import { FavIcon } from "./fav-icon";
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";
import { ObservableTextInput, ObservableTextInputOptions, PrescribedTextInput } from "~web-components/basic-building-blocks";

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

  
  isValidToSubmit = new Observable<boolean>(false).observe( (maySubmit) => {
    if (maySubmit) {
      this.addButton?.removeAttribute("disabled");
    } else {
      this.addButton?.setAttribute("disabled", "");
    }
  });

  updateIsValidToSubmit = () => {
    this.isValidToSubmit?.set(!!(
      this.domainName &&
      this.domainName.value &&
      this.derivationOptionsJson &&
      DerivationOptions(this.derivationOptionsJson.value)
    ));
  }

  add = () => {
    if (!this.isValidToSubmit.value || !this.name.value || ! this.derivationOptionsJson.value) return;
    addStoredPasswordConsumer({
      type: PasswordConsumerType.UserEntered,
      name: this.name.value,
      derivationOptionsJson: this.derivationOptionsJson.value
    });
    this.complete.send();
  }

  readonly urlOrDomainName = new Observable<string>()
    .onChange( newUrlOrDomainName => {
      this.prescribedDomainName.set( getRegisteredDomain(newUrlOrDomainName) );
    });

  readonly prescribedDomainName = new Observable<string>();
  readonly domainName = new Observable<string>().onChange( (newDomainName: string) => {
    this.prescribedDerivationOptionsJson.set(passwordDerivationOptionsJson(newDomainName));
    this.prescribedName.set(
      (newDomainName.split(".")[0]?.charAt(0) ?? "").toLocaleUpperCase() +
      (newDomainName.split(".")[0]?.substr(1) ?? "")
    );
    this.updateIsValidToSubmit();
  });

  readonly prescribedDerivationOptionsJson = new Observable<string>();
  readonly derivationOptionsJson = new Observable<string>()
    .observe( () => this.updateIsValidToSubmit() );

  readonly prescribedName = new Observable<string>();
  readonly name = new Observable<string>()
    .observe( () => this.updateIsValidToSubmit() );

  addButton?: HTMLButtonElement;

  // imageContainerDiv?: Div;
  // faviconImage?: HTMLImageElement;


  // private deriveImage = () => {
  //   this.imageContainerDiv?.clear();
  //   this.imageContainerDiv?.append(
  //     new FavIcon({domain: this.derivedDomain})
  //   );
  // }


  render() {

    super.render();
    this.addClass(layoutStyles.stretched_column_container)
    this.append(
      Div({class: dialogStyles.instructions ,text: `You can fill in all the options simply by pasting the URL of the service you need a password for into the first field.`}),
      Label({class: styles.item_label},
        Span({class: styles.label_span},"Enter the domain name or HTTPS URL of the application/service the password is for:"),
        Div({style: "display: flex; flex-direction: row"},
          new ObservableTextInput({
            style: `min-width: 50vw;`,
            observable: this.urlOrDomainName
          } as ObservableTextInputOptions),
        )
      ),
      Label({class: styles.item_label},
        Span({class: styles.label_span},"The domain name with which this password may be shared:"),
        new PrescribedTextInput({
          style: `min-width: 50vw;`,
          observable: this.domainName,
          prescribed: this.prescribedDomainName
        }),
      ),
      Label({class: styles.item_label},
        Span({class: styles.label_span},"JSON formatted password derivation options:"),
        new PrescribedTextInput({
          style: `min-width: 50vw;`,
          observable: this.derivationOptionsJson,  
          prescribed: this.prescribedDerivationOptionsJson
        }),
      ),
      Label({},
        Span({class: styles.label_span},"The name of this type of password (to appear in the passwords-generation menu):"),
        new PrescribedTextInput({
          style: `min-width: 50vw;`,
          observable: this.name,
          prescribed: this.prescribedName
        }),
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
