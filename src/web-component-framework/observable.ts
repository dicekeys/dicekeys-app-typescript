import {
  ComponentEvent
} from "./component-event"
import { jsonStringifyWithSortedFieldOrder } from "../api-handler/json";

export class Observable<T> {
  public readonly changedEvent: ComponentEvent<[newValue: T, previousValue: T | undefined], this>;
  protected _value: T | undefined;

  constructor(_value?: T) {
    this.changedEvent = new ComponentEvent<[newValue: T, previousValue: T | undefined]>(this);
    this.write(_value);
  }

  static from = <T>(
    initialValue: OptionallyObservable<T>
  ): Observable<T> =>
    ((initialValue == null) || !(initialValue instanceof Observable)) ?
      new Observable<T>(initialValue) :
      initialValue;

  /**
   * Calls the callback function with the new value whenever the value changes.
   * 
   * @param callback Called whenever the value changes. 
   * The first parameter to the callback receives the new value and the second
   * receives the previous value.
   */
  onChange = ( callback: (value: T, previousValue: T | undefined) => any ): this => {
    this.changedEvent.on( callback );
    return this;
  }

  /**
   * Like `on`, but call the callback immediately with the value of the observable
   * at the time of this call
   * 
   * @param callback Called whenever the value changes. 
   * The first parameter to the callback receives the new value and the second
   * receives the previous value.
   */
  observe = ( callback: (newValue: T | undefined, previousValue: T | undefined) => any ): this => {
    this.changedEvent.on( callback );
    callback(this.value, this.value);
    return this;
  }

  update = (objectToWriteTo: {textContent: string | null | undefined}) => {
    this.observe( newValue => {
      if (newValue != null) {
        objectToWriteTo.textContent = `${newValue}`;
      }
    })
    return this;
  }

  static equals = (a: any, b: any): boolean =>
      (a === b)
      ||
      (
        typeof a === "object" && typeof b === "object" &&
        jsonStringifyWithSortedFieldOrder(a) === jsonStringifyWithSortedFieldOrder(b)
      );

  /**
   * Writes the private representation of the observed value.
   * @param value The value to write
   */
  protected write(value: T | undefined): any {
    this._value = value;
  }

  /**
   * A read operation to abstract away the internal storage of the observed value
   * @returns The current value of the observed value
   */
  protected read(): T | undefined {
    return this._value;
  }

  public set = (value: T): this => {
    const previousValue = this.read();
    if (previousValue !== value) {
      this.write(value)
      this.changedEvent.send(value, previousValue);
    }
    return this;
  }

  /**
   * Have this observable match the value of another observable.
   * @param anotherObservable 
   */
  public observes(anotherObservable: Observable<T>) {
    const currentValue = anotherObservable.value;
    if (currentValue != null) {
      this.set(currentValue);
    }
    anotherObservable.onChange( this.set );
  }

  /**
   * Use a getter and setter to read and write the observable value,
   * triggering events as necessary when the value is set.
   */
  public get value(): T | undefined {
    return this.read();
  };
  public set value(value: T | undefined) {
    this.set(value!);
  }


}
export type OptionallyObservable<T> = T | Observable<T>
