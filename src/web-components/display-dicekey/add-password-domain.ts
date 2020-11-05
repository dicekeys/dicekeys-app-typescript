import styles from "./add-password-domain.module.css";
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
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";
import {
  Instructions,
  PrescribedTextFieldObservables,
  PrescribedTextInput
} from "~web-components/basic-building-blocks";
import { CenteredControls } from "~web-components/basic-building-blocks";

   
export interface AddPasswordDomainOptions extends Attributes {}

export class AddPasswordDomain extends Component<AddPasswordDomainOptions> {

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
      this.domainNamesInDomainNamesField.length > 0 &&
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

  readonly urlOrDomainNames = new Observable<string>("");

  get domainNamesInUrlOrDomainNamesField(): string[] {
    return (this.urlOrDomainNames.value ?? "")
        .split(",")
        .map( n => n.trim() )
        .filter( n => !!n )
        .map( getRegisteredDomain );
  }

  readonly prescribedDomainNames = new Observable<string>("");

  get domainNamesInDomainNamesField(): string[] {
    return (this.domainNamesField?.value ?? "")
        .split(",")
        .map( n => n.trim() )
        .filter( n => !!n )
  }

  readonly domainNamesField = new Observable<string>("");
  
  readonly prescribedDerivationOptionsJson = new Observable<string>();
  readonly derivationOptionsJson = new Observable<string>("");

  readonly prescribedName = new Observable<string>("");
  readonly name = new Observable<string>("");

  addButton?: HTMLButtonElement;

  readonly domainNamesFieldObservables = new PrescribedTextFieldObservables('domain', {
    actual: this.domainNamesField,
    prescribed: this.prescribedDomainNames
  });

  readonly derivationOptionsFieldObservables = new PrescribedTextFieldObservables('derivation options', {
    actual: this.derivationOptionsJson,  
    prescribed: this.prescribedDerivationOptionsJson
  })

  readonly nameFieldObservables = new PrescribedTextFieldObservables('name', {
    actual: this.name,
    prescribed: this.prescribedName
  });

  constructor(
    options: AddPasswordDomainOptions
  ) {
      super(options);
      this.addClass(styles.add_password_domain);

      this.urlOrDomainNames.onChange( () => {
        this.prescribedDomainNames.set( this.domainNamesInUrlOrDomainNamesField.join(", ") );
      });

      this.domainNamesField.observe( () => {
        const domainNames = this.domainNamesInDomainNamesField;
        this.prescribedDerivationOptionsJson.set(passwordDerivationOptionsJson(domainNames));
        this.prescribedName.set( domainNames.length === 0 ? "" :
          (domainNames[0].split(".")[0]?.charAt(0) ?? "").toLocaleUpperCase() +
          (domainNames[0].split(".")[0]?.substr(1) ?? "")
        );
        this.updateIsValidToSubmit();
      });

      this.derivationOptionsJson.observe( () => this.updateIsValidToSubmit() );
      this.name.observe( () => this.updateIsValidToSubmit() );
  
  }


  // imageContainerDiv?: Div;
  // faviconImage?: HTMLImageElement;


  // private deriveImage = () => {
  //   this.imageContainerDiv?.clear();
  //   this.imageContainerDiv?.append(
  //     new FavIcon({domain: this.derivedDomain})
  //   );
  // }


  render() {

    super.render(
      Div({class: layoutStyles.stretched_column_container, style: `padding-left: 10vw; padding-right: 10vw;`},
        Instructions(`
          The DiceKeys app derives passwords from your DiceKey and a set of options that restrict which sites can use the password.
          If you paste in the URL or domain name of the site you need a password for, this form will fill in the rest.
        `),
        Label({class: styles.item_label},
          Span({class: styles.label_span},"Enter the domain name or HTTPS URL of the application/service the password is for:"),
          // Div({style: "display: flex; flex-direction: row"},
            new PrescribedTextInput({
              style: `min-width: 40rem;`,
              observables: new PrescribedTextFieldObservables("urlOrDomainNames", {
                actual: this.urlOrDomainNames
              })
            }),
          // )
        ),
        Label({class: styles.item_label},
          Span({class: styles.label_span},
            `The domain name(s) allowed to access the password, derived from the above field by default.
            Use the default value (in green) if at all possible.  If you customize this value and forget it, you will be unable to re-generate
            passwords.
          `),
          new PrescribedTextInput({
            style: `min-width: 50vw;`, observables: this.domainNamesFieldObservables
          }),
        ),
        Label({class: styles.item_label},
          Span({class: styles.label_span},`The password derivation options that will be applied, derived from the above field by default.
            Use the default value (in green) if at all possible.  If you customize this value and forget it, you will be unable to re-generate
            passwords.
          `),
          new PrescribedTextInput({
            style: `min-width: 50vw;`,
            observables: this.derivationOptionsFieldObservables,
          }),
        ),
        Label({},
          Span({class: styles.label_span},`The name you will give to this new password type so that you can identify it in the passwords menu.
          You can safely customize this value as it will not effect the value of the generated password.`),
          new PrescribedTextInput({
            style: `min-width: 50vw;`,
            observables: this.nameFieldObservables,
          }),
        ),
        CenteredControls(
          Button({value: "Cancel"}, "Cancel").with( e => {
            e.events.click.on( this.complete.send )
          }),
          Button({value: "Add", disabled: ""}, "Add").with( e => {
            this.addButton = e.primaryElement;
            e.events.click.on( this.add )
          }),
        )
      ),
    );
  }

}
