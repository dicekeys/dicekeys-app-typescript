import style from "./prescribed-text-input.module.css";
import {
  Component, Div
} from "../../web-component-framework";
import {
  ObservableTextInput,
  ObservableTextInputOptions,
} from "./observable-text-input";
import {
  ToggleButton, ToggleButtonOptions
} from "./toggle-button";
import {
  PrescribedTextFieldObservables
} from "./prescribed-text-field-observables";


class UsePrescribedTextToggle extends ToggleButton<"span"> {
  constructor(options: ToggleButtonOptions<"span">) {
    super(options);
    this.addClass(style.toggle_span);
    this.options.booleanObservable.observe( (usePrescribedValue) => {
      if (usePrescribedValue) {
        this.primaryElement.style.removeProperty('text-decoration');
      } else {
        this.primaryElement.style.setProperty('text-decoration', 'line-through');
      }
    });
  }
  render() {
    super.render("&#x1F589;");
  }
}


type PrescribedTextInputFieldOptions<T extends string = string, NAME extends string = string> = ObservableTextInputOptions & {
  observables: PrescribedTextFieldObservables<T, NAME>
}
class PrescribedTextInputField<
  T extends string = string,
  NAME extends string = string,
  OPTIONS extends PrescribedTextInputFieldOptions<T, NAME> = PrescribedTextInputFieldOptions<T, NAME>
> extends ObservableTextInput<OPTIONS> {
  /**
   * The value the user set if choosing not to use the prescribed text.
   * (Kept here when the text field is using the prescribed value.)
   */
  lastNonPrescribedValue: string | undefined;

  constructor(options: OPTIONS) {
    super(options! ?? {});
    this.options.observables.actual.observe( newValue => {
      if (this.primaryElement.value !== newValue) {
        this.primaryElement.value = newValue ?? "";
      }
    })
    this.options.observables.usePrescribed.observe( newUsePrescribed => {
      this.primaryElement.style.setProperty("background-color",
        newUsePrescribed ? "#F0F0F0" : "#FFFFFF"
      )
      this.primaryElement.style.setProperty("color",
        newUsePrescribed ? "rgb(0, 128, 0)" : "#000040"
      )
    })
  }
}

export type PrescribedTextInputOptions = PrescribedTextInputFieldOptions
export class PrescribedTextInput extends Component<PrescribedTextInputOptions> {

  constructor(options: PrescribedTextInputFieldOptions) {
    super(options);
    this.addClass(style.optional_prescribed_text_input);
  }

  get observable() { return this.options.observables.actual };
  observe = (callback: (newValue: string, oldValue: string) => any): this => {
    this.options.observables.actual.observe( (newValue, oldValue) => callback(newValue ?? "", oldValue ?? "") );
    return this;
  }
  get value(): string | "" { return this.options.observables.actual.value ?? ""}

  render() {
    super.render(
      ...(this.options.observables.formula.value ? [
        Div({class: style.formula}, this.options.observables.formula.value )
      ] : []),
      Div({class: style.text_box_and_toggle},
        new PrescribedTextInputField(this.options),
        new UsePrescribedTextToggle({booleanObservable: this.options.observables.usePrescribed})
      )
    );
  }
}
