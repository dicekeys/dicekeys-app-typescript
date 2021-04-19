
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
  get minusOne(): number | undefined {
    if (this.numericValue && this.numericValue > this.minValue) {
      return this.numericValue - 1;
    } else {
      return;
    }
  }
  get plusOne(): number {
    return this.numericValue ? this.numericValue + 1 : this.minValue;
  }
  constructor(
    public readonly minValue: number = 0,
    private setNumericValue?: (value: number | undefined) => any,
    initialValue?: string | number
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

export const NumberPlusMinusView = observer( (props: {label: string, state: NumericTextFieldState}) => {
  const {
    label, state
  } = props;
  return (
    <div className={css.field_row}>
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <CharButton
              style={{visibility: state.numericValue !== undefined ? "visible" : "hidden"}}
              onClick={ () => state.setValue(state.minusOne) }
            >-<CharButtonToolTip>- 1 = {state.minusOne ?? ( <i>none</i>) }</CharButtonToolTip></CharButton>
          <NumericTextField className={ css.sequence_number_text_field } state={state} />
          <CharButton onClick={ () => state.setValue( state.plusOne ) }
          >+<CharButtonToolTip>+ 1 = { state.plusOne }</CharButtonToolTip></CharButton>
        </div>
        <label className={css.label_below}>{label}</label>
      </div>
    </div>
  );
});
