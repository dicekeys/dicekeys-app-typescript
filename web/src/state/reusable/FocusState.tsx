import { action, makeAutoObservable } from "mobx";

export class FieldFocusState<T extends string = string, F extends T = T> {
  get inFocus(): boolean { return this.field === this.parent.fieldInFocus }
  readonly focus: () => void;
  readonly toggleFocus: () => void;
  
  constructor(readonly parent: FormFocusState<T>, readonly field: F) {
    this.focus = this.parent.setFieldInFocusFn(this.field);
    this.toggleFocus = parent.toggleFieldInFocusFn(this.field);
    makeAutoObservable(this);
  }
}

export class FormFocusState<T extends string = string> {
  #focusStateCache: Map<T, FieldFocusState<T>>;

  readonly focusStateForField = <F extends T = T>(fieldName: F): FieldFocusState<T, F> => {
    if (!this.#focusStateCache.has(fieldName)) {
      this.#focusStateCache.set(fieldName, new FieldFocusState<T, F>(this, fieldName));
    }
    return this.#focusStateCache.get(fieldName) as FieldFocusState<T, F>;
  }

  private _fieldInFocus: T | undefined;
  get fieldInFocus() { return this._fieldInFocus }
  readonly setFieldInFocus = action ( (newValue: T | undefined) => this._fieldInFocus = newValue );
  readonly setFieldInFocusFn = (newValue: T | undefined) => () => this.setFieldInFocus(newValue);
  readonly toggleFieldInFocus = (fieldToToggle: T) => this.setFieldInFocus(
      (this.fieldInFocus === fieldToToggle) ? undefined : fieldToToggle);
  readonly toggleFieldInFocusFn = (fieldToToggle: T) => () => this.toggleFieldInFocus(fieldToToggle);
  
  constructor(initialFieldInFocus?: T) {
    this.#focusStateCache = new Map();
    this._fieldInFocus = initialFieldInFocus;
    makeAutoObservable(this);
  }
}
