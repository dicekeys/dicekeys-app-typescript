import {
  Component,
} from "../../web-component-framework";
import { 
  TextInput,
  Observable,
} from "../../web-component-framework";


export type ObservableTextInputOptions = NonNullable<Parameters<typeof TextInput>[0]> & {
  observe?: Parameters<Observable<string>["observe"]>[0];
  onChange?: Parameters<Observable<string>["onChange"]>[0];
  observable?: Observable<string>,
};


export class ObservableTextInput<
OPTIONS extends ObservableTextInputOptions = ObservableTextInputOptions
> extends Component<OPTIONS, "input"> {

public readonly observable: Observable<string>;

constructor(options?: OPTIONS) {
  super(options! ?? {},
    // Pass <input type="text"> element as primary element
    ( () => {
      const element = document.createElement("input");
      element.setAttribute("type", "text");
      return element;
    })()
    );
    this.observable = this.options.observable ?? new Observable<string>(this.options.value);
    if (this.options.observable && this.options.value) {
      this.options.observable.set(this.options.value);
    }
    this.primaryElement.addEventListener("change", this.onPossibleChange );
    this.primaryElement.addEventListener("keyup", this.onPossibleChange );
    if (this.options.observe) {
      this.observable.observe(this.options.observe);
    }
    if (this.options.onChange) {
      this.observable.onChange(this.options.onChange);
    }
  }

  public get value(): string | undefined { return this.primaryElement.value; }
  public set = (value: string | undefined) => { 
    this.primaryElement.value = value ?? "";
    this.observable.set(value ?? "");
  }
  public set value(v: string | undefined) { this.set(v) }
  public observe =   (callback: (newValue: string | undefined, oldValue: string | undefined) => any): this => {
    this.observable.observe(callback);
    return this;
  }
  public get on() { return this.observable.onChange; }

  protected onPossibleChange = () => {
    this.observable.set(this.primaryElement.value);
  }
  render() {}
}
