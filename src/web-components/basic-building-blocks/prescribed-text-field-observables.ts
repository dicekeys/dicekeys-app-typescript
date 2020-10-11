import {
  Observable, OptionallyObservable
} from "../../web-component-framework";

export interface PrescribedTextFieldSpecification<T extends string = string> {
  observable?: OptionallyObservable<T | "">;
  prescribed?: OptionallyObservable<T | "">;
  usePrescribed?: OptionallyObservable<boolean>
  forceUsePrescribed?: boolean;
}

export type PrescribedTextFieldObservablesOrSpecification<T extends string = string, NAME extends string = string> =
  PrescribedTextFieldSpecification<T> | PrescribedTextFieldObservables<T, NAME>;

export class PrescribedTextFieldObservables<T extends string = string, NAME extends string = string> {
  public readonly observable: Observable<T | "">;
  public readonly prescribed: Observable<T | "">;
  public readonly usePrescribed: Observable<boolean>;
  public readonly forceUsePrescribed: boolean;

  public get value(): (T | "") { return this.observable.value ?? "" }
  public set = (newValue: T | "") => { this.observable.set(newValue); return this; }

  constructor(
    public readonly name: NAME,
    spec: PrescribedTextFieldSpecification<T> = {},
  ) {
    this.prescribed = Observable.from(spec.prescribed ?? "");
    this.observable = Observable.from(spec.observable ?? this.prescribed.value ?? "");
    this.usePrescribed = Observable.from(spec.usePrescribed ?? true);
    this.forceUsePrescribed = !!spec.forceUsePrescribed;

    this.prescribed.observe( (newValue) => newValue != null && this.usePrescribed.value && this.observable.set(newValue) )
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
