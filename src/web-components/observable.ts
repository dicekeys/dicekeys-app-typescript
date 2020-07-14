import {
  ComponentEvent
} from "../web-components/component-event"
import { jsonStringifyWithSortedFieldOrder } from "../api-handler/json";


export class Observable<T> {

  public readonly changedEvent: ComponentEvent<[T | undefined]>;

  constructor(protected _value: T | undefined) {
    this.changedEvent = new ComponentEvent<[T | undefined]>(this);
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

  private set = (value: T | undefined): this => {
    if (!Observable.equals(this._value, value)) {
      this._value = value;
      this.changedEvent.send(value);
    }
    return this;
  }

  public get value(): T | undefined {
    return this._value;
  };
  public set value(value: T | undefined) {
    this.set(value);
  }


}
