
import React from "react";
import { observer } from "mobx-react";
import { CharButton, CharButtonToolTip } from "../../views/basics";


import { action, makeAutoObservable } from "mobx";
//import styled from "styled-components";


export class NumericTextFieldState {
  defaultValue: number;

  editingModeOn: boolean;
  textValue: string;
  valid: boolean;
  numericValue: number | undefined;

  setDefaultValue = action ( (newDefaultValue: number) => {
    this.defaultValue = newDefaultValue;
  });
  setTextValue = action( (newTextValue: string) => {
    this.editingModeOn = true;
    if (newTextValue !== this.textValue) { 
      this.textValue = newTextValue;
      const numericValue = parseInt(newTextValue);
      const valid = numericValue >= this.minValue;
      this.valid = valid;
      if (valid) {
        this.numericValue = numericValue;
      } else {
        this.numericValue = undefined;
      }
      this.onChanged?.(this.numericValue)
    }
  });
  clear = action ( () => {
    this.editingModeOn = false;
    this.textValue = "";
    this.valid= false;
    this.onChanged?.(undefined);
  });
  setValue = (newValue?: string | number) => this.setTextValue(`${newValue ?? ""}`);
  setToDefaultValue = () => this.setValue(this.defaultValue);
  onChangeInTextField = (e: React.ChangeEvent<HTMLInputElement>) => this.setValue(e.target.value);

  get decrementedValue(): number | undefined {
    const {numericValue} = this;
    return numericValue != null && (numericValue - this.incrementBy) >= this.minValue ?
      (numericValue - this.incrementBy) :
      undefined;
  }
  get incrementedValue(): number {
    const {numericValue} = this;
    return numericValue != null ? (numericValue + this.incrementBy) : (this.defaultValue ?? this.minValue);
  }
  increment = () => this.setValue(this.incrementedValue);
  decrement = () => this.setValue(this.decrementedValue);

  public readonly minValue;
  public readonly incrementBy: number;
  private readonly onChanged?: (value: number | undefined) => any;

  constructor({minValue = 0, incrementBy=1, defaultValue, initialValue, onChanged} : {
      minValue: number,
      incrementBy?: number,
      defaultValue: number,
      onChanged?: (value: number | undefined) => any,
      initialValue?: string
    }
  ) {
    this.minValue = minValue;
    this.incrementBy = incrementBy;
    this.defaultValue = defaultValue;
    this.onChanged = onChanged;
    this.textValue = `${initialValue ?? ""}`;
    const numericValue = parseInt(this.textValue);
    const valid = numericValue >= this.minValue;
    this.editingModeOn = valid;
    this.valid = valid;
    if (valid) {
      this.numericValue = numericValue;
    }
    makeAutoObservable(this);
  }
}

type CommonProps = {
  state: NumericTextFieldState;
  onFocusedOrChanged?: () => any;
}

export const IncrementDecrementKeyHandler = ({increment, decrement}: {increment: () => void, decrement: () =>void}): React.KeyboardEventHandler => (e) => {
  switch (e.key) {
    case "ArrowUp":
    case "+":
    case "=":
    case ".":
    case ">":
      increment();
      e.preventDefault();
      break;
    case "ArrowDown":
    case "-":
    case "_":
    case ",":
    case "<":
      decrement();
      e.preventDefault();
      break;
    default:
  }
}

// const NumberPlusMinusViewContainer = styled.div`
//   display: flex;
//   flex-direction: row;
//   align-items: flex-start;
// `;

export const NumberPlusMinusView = observer( (props: React.PropsWithChildren<CommonProps>) => {
  const {children, ...commonProps} = props;
  const {state,
  } = commonProps;
  return (
    <>
      <CharButton disabled={state.numericValue == null} onClick={ state.decrement  }
        >-{ state.numericValue == null ? null : (<CharButtonToolTip>- 1 = {state.decrementedValue ?? ( <i>none</i>) }</CharButtonToolTip>)}</CharButton>
      {children}
      <CharButton onClick={ state.increment }
      >+<CharButtonToolTip>+ 1 = { state.incrementedValue }</CharButtonToolTip></CharButton>
    </>
)});
