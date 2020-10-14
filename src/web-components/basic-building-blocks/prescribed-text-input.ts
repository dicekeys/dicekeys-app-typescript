import style from "./prescribed-text-input.module.css";
import {
  Attributes,
  Component, Div, Observable
} from "../../web-component-framework";
import {
  ObservableTextInput,
  ObservableTextInputOptions,
} from "./observable-text-input";
import {
  PrescribedTextFieldObservables
} from "./prescribed-text-field-observables";


interface UsePrescribedTextButtonOptions extends Attributes<"button"> {
  visibilityObservable: Observable<boolean>;
}
class UsePrescribedTextToggle extends Component<UsePrescribedTextButtonOptions,"button"> {
  constructor(options: UsePrescribedTextButtonOptions) {
    super(options);
    this.addClass(style.toggle_span);
    this.options.visibilityObservable.observe( (visibility) => {
        this.primaryElement.style.setProperty('visibility',visibility ? "visible" : "hidden");
    });
  }
  render() {
    super.render("&#x2ba8;");
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

  styleOnPrescribedObservableMatch = () => {
    const observables = this.options.observables;
    const matches = (observables.prescribed.value ?? "") === ( observables.actual.value ?? "");
    if (matches) {
      this.primaryElement.classList.remove(style.not_prescribed);
      this.primaryElement.classList.add(style.matches_prescribed);
    } else {
      this.primaryElement.classList.remove(style.matches_prescribed);
      this.primaryElement.classList.add(style.not_prescribed);
    }
  }

  constructor(options: OPTIONS) {
    super({observable: options.observables.actual,  ...(options! ?? {})});
    this.observable.observe( newValue => {
      this.styleOnPrescribedObservableMatch();
      if (this.primaryElement.value !== newValue) {
        this.primaryElement.value = newValue ?? "";
      }
    })
    this.options.observables.usePrescribed.observe( () =>
      this.styleOnPrescribedObservableMatch()
    )
  }
}

export type PrescribedTextInputOptions = PrescribedTextInputFieldOptions
export class PrescribedTextInput extends Component<PrescribedTextInputOptions, "div"> {

  readonly showUsePrescribedButton = new Observable<boolean>();
  #updateUsingPrescribed = () => {
    this.showUsePrescribedButton.set(this.options.observables.usePrescribed.value == false && !!this.options.observables.prescribed.value);
  } 
  constructor(options: PrescribedTextInputFieldOptions) {
    super(options, document.createElement("div"));
    this.addClass(style.prescribed_text_input);
    options.observables.prescribed.onChange( () => this.#updateUsingPrescribed() );
    options.observables.usePrescribed.observe( () => this.#updateUsingPrescribed() );
  }

  get observable() { return this.options.observables.actual };
  observe = (callback: (newValue: string, oldValue: string) => any): this => {
    this.options.observables.actual.observe( (newValue, oldValue) => callback(newValue ?? "", oldValue ?? "") );
    return this;
  }
  get value(): string | "" { return this.options.observables.actual.value ?? ""}

  render() {
    super.render(
      ...(this.options.observables.formula.value ? 
        [ this.options.observables.formula.value ] : []),
      Div({class: style.text_box_and_toggle},
        new PrescribedTextInputField({class: style.text_box,...this.options}),
        new UsePrescribedTextToggle({
          visibilityObservable: this.showUsePrescribedButton,
          events: events => events.click.on( () => this.options.observables.usePrescribed.set(true) )
        })
      )
    );
  }
}
