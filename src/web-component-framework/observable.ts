import {
  ComponentEvent
} from "./component-event"
import { jsonStringifyWithSortedFieldOrder } from "../api-handler/json";


export class Observable<T> {
  public readonly changedEvent: ComponentEvent<[T | undefined], this>;
  protected _value: T | undefined;

  constructor(_value?: T | undefined) {
    this.changedEvent = new ComponentEvent<[T | undefined]>(this);
    this.set(_value);
  }

  observe = ( callback: (value: T | undefined) => any ): this => {
    this.changedEvent.on( callback );
    callback(this.value);
    return this;
  }

  static equals = (a: any, b: any): boolean =>
      (a === b)
      ||
      (
        typeof a === "object" && typeof b === "object" &&
        jsonStringifyWithSortedFieldOrder(a) === jsonStringifyWithSortedFieldOrder(b)
      );

  protected write(value: T | undefined): any {
    this._value = value;
  }
  protected read(): T | undefined {
    return this._value;
  }

  public set = (value: T | undefined): this => {
    if (!Observable.equals(this.read(), value)) {
      this.write(value)
      this.changedEvent.send(value);
    }
    return this;
  }

  public get value(): T | undefined {
    return this.read();
  };
  public set value(value: T | undefined) {
    this.set(value);
  }


}
