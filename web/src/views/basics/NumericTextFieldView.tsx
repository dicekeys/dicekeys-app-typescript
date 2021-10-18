
import React from "react";
import { observer } from "mobx-react";
import { CharButton, CharButtonToolTip } from "../../views/basics";


import { action, makeAutoObservable } from "mobx";
import styled from "styled-components";


export class NumericTextFieldState {
  textValue: string;
  setValue = action ((newValue?: string | number) => {
    const newTextValue = `${newValue ?? ""}`;
    if (newTextValue !== this.textValue) { 
      this.textValue = `${newValue ?? ""}`
//      this.setNumericValue?.(this.numericValue);
      this.onChanged?.(this.numericValue)
    }
  });
  get numericValue(): number | undefined {
    const numericValue = parseInt(this.textValue);
    return numericValue >= this.minValue ? numericValue : undefined;
  }
  get decrementedValue(): number | undefined {
    return this.numericValue != null && (this.numericValue - this.incrementBy) >= this.minValue ?
      (this.numericValue - this.incrementBy) :
      undefined;
  }
  get incrementedValue(): number {
    return this.numericValue != null ? (this.numericValue + this.incrementBy) : (this.defaultValue ?? this.minValue);
  }
  increment = () => this.setValue(this.incrementedValue);
  decrement = () => this.setValue(this.decrementedValue);

  public readonly minValue;
  private defaultValue?: number;
  public readonly incrementBy: number;
  private readonly onChanged?: (value: number | undefined) => any;

  constructor({minValue = 0, incrementBy=1, defaultValue, initialValue, onChanged} : {
      minValue: number,
      incrementBy?: number,
      defaultValue?: number,
      onChanged?: (value: number | undefined) => any,
      initialValue?: string
    }
  ) {
    this.minValue = minValue;
    this.incrementBy = incrementBy;
    this.defaultValue = defaultValue;
    this.onChanged = onChanged;
    this.textValue = `${initialValue ?? ""}`
    makeAutoObservable(this);
  }
}

type CommonProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  state: NumericTextFieldState;
  onFocusedOrChanged?: () => any;
}

// export const NumericTextField = observer ( ({state, size, placeholder, onInput, onFocusedOrChanged, ...props}: CommonProps) => {
//   return (
//     <InputNumericText
//       // {...props}
//       $valueIsValidNumber={typeof state.numericValue === "number"}
//       value={state.textValue}
//       onInput={ e => {
//         state.setValue(e.currentTarget.value);
//         onFocusedOrChanged?.();
//         onInput?.(e);
//       } }
//       onFocus={ () => onFocusedOrChanged?.() }
//     />
//   )
// });

const RowVerticallyCenteredDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

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

export const NumberPlusMinusView = observer( (props: React.PropsWithChildren<CommonProps>) => {
  const {children, onKeyDown, ...commonProps} = props;
  const {state,
  //  onFocusedOrChanged
  } = commonProps;
  // const setValue = action ((newValue: number | undefined) => {
  //   state.setValue(newValue);
  //   onFocusedOrChanged?.()    
  // });
  // const keyHandler = IncrementDecrementKeyHandler(state);
  // const subtractOne = () => setValue(state.decrementedValue);
  // const addOne = () => setValue(state.incrementedValue);
  return (
    <RowVerticallyCenteredDiv>
      <CharButton invisible={state.numericValue == null} onClick={ state.decrement  }
        >-<CharButtonToolTip>- 1 = {state.decrementedValue ?? ( <i>none</i>) }</CharButtonToolTip></CharButton>
      {children}
      {/* <NumericTextField
        {...commonProps}
        onKeyDown={ e => {
          onKeyDown?.(e);
          keyHandler(e);
        } }
      /> */}
      <CharButton onClick={ state.increment }
      >+<CharButtonToolTip>+ 1 = { state.incrementedValue }</CharButtonToolTip></CharButton>
    </RowVerticallyCenteredDiv>
)});
