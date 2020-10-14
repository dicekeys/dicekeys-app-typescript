import {
  Appendable,
  Observable, OptionallyObservable
} from "../../web-component-framework";

export interface PrescribedTextFieldSpecification<T extends string = string> {
  formula?: OptionallyObservable<Appendable>;
  actual?: OptionallyObservable<T | "">;
  prescribed?: OptionallyObservable<T | "">;
  usePrescribed?: OptionallyObservable<boolean>
//  forceUsePrescribed?: boolean;
}

export type PrescribedTextFieldObservablesOrSpecification<T extends string = string, NAME extends string = string> =
  PrescribedTextFieldSpecification<T> | PrescribedTextFieldObservables<T, NAME>;

export class PrescribedTextFieldObservables<T extends string = string, NAME extends string = string> {
  public readonly  formula: Observable<Appendable>;  
  public readonly actual: Observable<T | "">;
  public readonly prescribed: Observable<T | "">;
  public readonly usePrescribed: Observable<boolean>;
//  public readonly forceUsePrescribed: boolean;

  public get value(): (T | "") { return this.actual.value ?? "" }
  public set = (newValue: T | "") => { this.actual.set(newValue); return this; }

  constructor(
    public readonly name: NAME,
    spec: PrescribedTextFieldSpecification<T> = {},
  ) {
    this.formula = Observable.from(spec.formula ?? "");
    this.prescribed = Observable.from(spec.prescribed ?? "");
    this.actual = Observable.from(spec.actual ?? this.prescribed.value ?? "");
    this.usePrescribed = Observable.from(spec.usePrescribed ?? true);
//    this.forceUsePrescribed = !!spec.forceUsePrescribed;
    this.actual.observe( newActualValue => {
      if ( (newActualValue ?? "") !== (this.prescribed.value ?? "") ) {
        // The user changed the value to something other than prescribed
        this.usePrescribed.set(false);
      }
    }

    )
    this.prescribed.observe( (newValue) => {
      // When the prescribed value changes and the field is supposed to use the prescribed value,
      // copy the new prescribed value to the d value
      if (newValue != null && this.usePrescribed.value) {
        this.actual.set(newValue);
      }
    });
    this.usePrescribed.observe( (newUsePrescribed) => {
      if (newUsePrescribed) {
        // When switching from not using the prescribed value to using it, copy the prescribed value
        // back into the observable value.
        this.actual.set(this.prescribed.value ?? "");
      }
    });
  }

  // observe = (callback: Parameters<Observable<T | "">["observe"]>[0]) => this.observable.observe(callback);

  static from = <T extends string = string, NAME extends string = string>(
    name: NAME,
    source?: PrescribedTextFieldSpecification<T> | PrescribedTextFieldObservables<T, NAME>
  ) => {
    if (source instanceof PrescribedTextFieldObservables) {
      return source;
    } else {
      return new PrescribedTextFieldObservables<T, NAME>(name, source);
    }
  } 
}
