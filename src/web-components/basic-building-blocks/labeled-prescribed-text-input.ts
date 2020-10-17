import styles from "./labeled-prescribed-text-input.module.css";
import {
  Component, Label, Div, Appendable
} from "../../web-component-framework";
import {
  PrescribedTextInput, PrescribedTextInputOptions
} from "./prescribed-text-input";

type LabelPrescribedTextInputOptions = PrescribedTextInputOptions;
export class LabeledPrescribedTextInput extends Component<LabelPrescribedTextInputOptions> {
  protected appendable: readonly Appendable[];

  constructor(
    options: LabelPrescribedTextInputOptions,
    ...appendable: readonly Appendable[]
  ) {
    super(options);
    this.appendable = appendable;
  } 

  render() {
    this.append(
      Div({},
        Label({class: styles.label}, ...this.appendable,
          new PrescribedTextInput({class: styles.input_class, ...this.options})
        )
      )
    );
  }
}

