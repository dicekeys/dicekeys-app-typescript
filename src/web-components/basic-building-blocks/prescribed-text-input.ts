import style from "./prescribed-text-input.module.css";
import {
  Component, OptionallyObservable,
  Observable,
} from "../../web-component-framework";
import {
  ObservableTextInput,
  ObservableTextInputOptions,
} from "./observable-text-input";
import {
  ToggleButton, ToggleButtonOptions
} from "./toggle-button";

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




type PrescribedTextInputFieldOptions = ObservableTextInputOptions & {
  prescribed?:  OptionallyObservable<string>
  usePrescribed?: OptionallyObservable<boolean>,
  forceUsePrescribed?: boolean
}
class PrescribedTextInputField<
  OPTIONS extends PrescribedTextInputFieldOptions = PrescribedTextInputFieldOptions
> extends ObservableTextInput<OPTIONS> {

  /**
   * The value the user set if choosing not to use the prescribed text.
   * (Kept here when the text field is using the prescribed value.)
   */
  lastNonPrescribedValue: string | undefined;
  #usePrescribedValue: Observable<boolean>
  #prescribedValue: Observable<string>;

  get prescribedValue() { return this.#prescribedValue };
  get usePrescribedValue() { return this.#usePrescribedValue };

  onPrescribedValueChanged = (newValue: string | undefined) => {
    if (this.usePrescribedValue.value) {
      this.set(newValue);
    }
  }

  onUsePrescribedValueChanged = ( usePrescribedValue: boolean ) => {
    this.primaryElement.disabled = usePrescribedValue;
    if (usePrescribedValue) {
      this.lastNonPrescribedValue = this.value;
      const prescribedValue = this.prescribedValue;
      this.set(
        typeof (prescribedValue) === "string" ?
          prescribedValue :
          prescribedValue?.value ?? ""
      );
    } else if (this.lastNonPrescribedValue != null) {
      // restore the last non-prescribed value
      this.set(this.lastNonPrescribedValue);
    }

  }

  constructor(options?: OPTIONS) {
    super(options! ?? {});
    this.#prescribedValue = Observable.from<string>(this.options.prescribed ?? "")
    this.#usePrescribedValue = Observable.from(this.options.usePrescribed ?? true)
    this.usePrescribedValue.onChange( this.onUsePrescribedValueChanged ?? this.options.forceUsePrescribed !== false );
    this.prescribedValue.observe( this.onPrescribedValueChanged );
  }
}

export type PrescribedTextInputOptions = PrescribedTextInputFieldOptions
export class PrescribedTextInput extends Component<PrescribedTextInputOptions> {
  private prescribedTextInput?: PrescribedTextInputField

  constructor(options: PrescribedTextInputFieldOptions) {
    super(options);
    this.addClass(style.optional_prescribed_text_input);
  }

  get observable() { return this.prescribedTextInput!.observable };
  observe = (callback: (newValue: string, oldValue: string) => any): this => {
    this.observable.observe( (newValue, oldValue) => callback(newValue ?? "", oldValue ?? "") );
    return this;
  }
  get value(): string | "" { return this.prescribedTextInput?.value ?? ""}

  render() {
    super.render(
      new PrescribedTextInputField(this.options).with( e => this.prescribedTextInput = e ),
      ...(this.options.forceUsePrescribed ?
        [] :
        [new UsePrescribedTextToggle({booleanObservable: this.prescribedTextInput!.usePrescribedValue})]
      )
    );
  }
}
