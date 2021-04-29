
import css from "./basic.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { CharButton, CharButtonToolTip } from "../../views/basics";


import { action, makeAutoObservable } from "mobx";


export class NumericTextFieldState {
  textValue: string;
  setValue = action ((newValue?: string | number) => {
    this.textValue = `${newValue ?? ""}`
    this.setNumericValue?.(this.numericValue);
  });
  get numericValue(): number | undefined {
    const numericValue = parseInt(this.textValue);
    return numericValue >= this.minValue ? numericValue : undefined;
  }
  get minusOne(): number {
    return this.numericValue != null && this.numericValue - 1 > this.minValue ?
      this.numericValue - 1 :
      (this.defaultValue ?? this.minValue);
  }
  get plusOne(): number {
    return this.numericValue != null ? this.numericValue + 1 : (this.defaultValue ?? this.minValue);
  }
  constructor(
    public readonly minValue: number = 0,
    private defaultValue?: number,
    private setNumericValue?: (value: number | undefined) => any,
    initialValue?: string,
  ) {
    this.textValue = `${initialValue ?? ""}`
    makeAutoObservable(this);
  }
}

export interface NumericTextFieldProps {
  state: NumericTextFieldState;
  className?: string;
};

export const NumericTextField = observer ( (props: NumericTextFieldProps) => {
  return (
    <input
      className={props.className}
      style={typeof props.state.numericValue == "number" ? {} :{color: "red"}}
      placeholder={"none"} type="text" value={props.state.textValue} onInput={ e => props.state.setValue(e.currentTarget.value) }
    />
  )
});

export const NumberPlusMinusView = observer( ({state, textFieldClassName}: {
  state: NumericTextFieldState
  textFieldClassName: string
}) => (
  <div className={css.hstack}>
    <CharButton
        style={{visibility: state.numericValue! > state.minValue ? "visible" : "hidden"}}
        onClick={ () => state.setValue(state.minusOne) }
      >-<CharButtonToolTip>- 1 = {state.minusOne ?? ( <i>none</i>) }</CharButtonToolTip></CharButton>
    <NumericTextField className={ textFieldClassName } state={state} />
    <CharButton onClick={ () => state.setValue( state.plusOne ) }
    >+<CharButtonToolTip>+ 1 = { state.plusOne }</CharButtonToolTip></CharButton>
  </div>
));
