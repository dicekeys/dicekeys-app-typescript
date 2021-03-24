import React from "react";
import ReactDOM from "react-dom";
import {makeAutoObservable} from "mobx";
import { observer  } from "mobx-react";
import { DerivationRecipeTemplateList } from "../../dicekeys/derivation-recipe-templates";


interface NumericTextFieldProps {
  value: number;
  setValue: (newValue: number) => void;
  isValid?: (value: string) => boolean;
};

export const NumericTextField = (props: NumericTextFieldProps) => {
  const isValid = props.isValid ?? ((stringValue: string) => !isNaN(parseInt(stringValue)));
  const onChange = (target: HTMLInputElement): void => {
    const stringValue = target.value;
    if (isValid(stringValue)) {
      const numericValue = parseInt(stringValue);
      if (numericValue != props.value) {
        props.setValue( parseInt(stringValue) ) 
      }
    }
  }
  return (
    <input type="text" value={props.value} onKeyUp={ e => onChange(e.currentTarget) } onChange={ e => onChange(e.currentTarget) } />
  )
};

interface SequenceNumberState {
  sequenceNumber: number;
  setSequenceNumber: (newSequenceNumber: number) => void
}

export const SequenceNumberView = observer( ({sequenceNumberState}: {sequenceNumberState: SequenceNumberState}) => {
  return (
    <div>
      <NumericTextField 
        value={ sequenceNumberState.sequenceNumber }
        setValue={ value => sequenceNumberState.sequenceNumber = value }
        isValid={ stringValue => parseInt(stringValue) > 0 }
      />
      <button onClick={ () => sequenceNumberState.setSequenceNumber( sequenceNumberState.sequenceNumber + 1 ) } >+</button>
      <button onClick={ () => sequenceNumberState.setSequenceNumber( Math.max(1, sequenceNumberState.sequenceNumber - 1 )) } >-</button>
    </div>
  );
});


export class DerivationViewState {

  sequenceNumber: number = 1;
  setSequenceNumber = (newSequenceNumber: number) => this.sequenceNumber = newSequenceNumber;

  constructor() { makeAutoObservable(this) }

}

interface DerivationViewProps {
  derivationViewState: DerivationViewState
}
export const DerivationView = observer( ( props: DerivationViewProps) => {
  return (
    <SequenceNumberView sequenceNumberState={props.derivationViewState}  />
  );
});

