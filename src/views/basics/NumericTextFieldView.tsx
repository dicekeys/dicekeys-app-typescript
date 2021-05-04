
import css from "./basic.module.css";
import React from "react";
import { observer } from "mobx-react";
import { CharButton, CharButtonToolTip } from "../../views/basics";


import { action, makeAutoObservable } from "mobx";


export class NumericTextFieldState {
  textValue: string;
  setValue = action ((newValue?: string | number) => {
    const newTextValue = `${newValue ?? ""}`;
    if (newTextValue !== this.textValue) { 
      this.textValue = `${newValue ?? ""}`
      this.setNumericValue?.(this.numericValue);
    }
  });
  get numericValue(): number | undefined {
    const numericValue = parseInt(this.textValue);
    return numericValue >= this.minValue ? numericValue : undefined;
  }
  get minusOne(): number | undefined {
    return this.numericValue != null && this.numericValue - 1 > this.minValue ?
      this.numericValue - 1 :
      undefined;
  }
  get plusOne(): number {
    return this.numericValue != null ? this.numericValue + 1 : (this.defaultValue ?? this.minValue);
  }

  public readonly minValue;
  private defaultValue?: number;
  private setNumericValue?: (value: number | undefined) => any;

  constructor({minValue = 0, defaultValue, setNumericValue, initialValue} : {
      minValue: number,
      defaultValue?: number,
      setNumericValue?: (value: number | undefined) => any,
      initialValue?: string,
      onFocusedOrChanged?: () => any
    }
  ) {
    this.minValue = minValue;
    this.defaultValue = defaultValue;
    this.setNumericValue = setNumericValue;
    this.textValue = `${initialValue ?? ""}`
    makeAutoObservable(this);
  }
}

export interface NumericTextFieldProps {
  state: NumericTextFieldState;
  size?: number;
  className?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onFocusedOrChanged?: () => any;
};

export const NumericTextField = observer ( (props: NumericTextFieldProps) => {
  return (
    <input
      className={props.className}
      type="text"
      size={props.size ?? 4}
      value={props.state.textValue}
      style={typeof props.state.numericValue == "number" ? {} :{color: "red"}}
      placeholder={"none"}
      onInput={ e => {
        props.state.setValue(e.currentTarget.value);
        props.onFocusedOrChanged?.();
      } }
      onKeyDown={ props.onKeyDown }
      onFocus={ () => props.onFocusedOrChanged?.() }
    />
  )
});


export const NumberPlusMinusView = observer( ({state, textFieldClassName, size, onFocusedOrChanged}: {
  state: NumericTextFieldState,
  textFieldClassName: string,
  size?: number,
  onFocusedOrChanged?: () => any
}) => {
  const setValue = action ((newValue: number | undefined) => {
    state.setValue(newValue);
    onFocusedOrChanged?.()    
  });
  const subtractOne = () => setValue(state.minusOne);
  const addOne = () => setValue(state.plusOne);
  return (
    <div className={css.hstack}>
      <CharButton hidden={state.numericValue == null} onClick={ subtractOne  }
        >-<CharButtonToolTip>- 1 = {state.minusOne ?? ( <i>none</i>) }</CharButtonToolTip></CharButton>
      <NumericTextField
        className={ textFieldClassName }
        size={size} state={state}
        onFocusedOrChanged={onFocusedOrChanged}
        onKeyDown={ e => {
          switch (e.key) {
            case "ArrowUp":
            case "+":
            case "=":
            case ".":
            case ">":
              addOne();
              e.preventDefault();
              break;
            case "ArrowDown":
            case "-":
            case "_":
            case ",":
            case "<":
              subtractOne();
              e.preventDefault();
              break;
            default:
          }
        } }
      />
      <CharButton onClick={ addOne }
      >+<CharButtonToolTip>+ 1 = { state.plusOne }</CharButtonToolTip></CharButton>
    </div>
)});
