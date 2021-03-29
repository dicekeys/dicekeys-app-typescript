import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";

interface NumericTextFieldProps {
  value: number;
  setValue: (newValue: number) => void;
  className?: string;
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
    <input className={props.className} type="text" value={props.value} onKeyUp={ e => onChange(e.currentTarget) } onChange={ e => onChange(e.currentTarget) } />
  )
};

export interface SequenceNumberState {
  sequenceNumber?: number;
  setSequenceNumber: (newSequenceNumber: number | undefined) => void
}

export const SequenceNumberView = observer( ({sequenceNumberState}: {sequenceNumberState: SequenceNumberState}) => {
  return (
    <div className={css.field_row}>
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <button onClick={ () => sequenceNumberState.setSequenceNumber( Math.max(1, (sequenceNumberState.sequenceNumber ?? 1) - 1 )) } >-</button>
          <NumericTextField
            className={ css.sequence_number_text_field }
            value={ sequenceNumberState.sequenceNumber ?? 1 }
            setValue={ value => sequenceNumberState.sequenceNumber = value }
            isValid={ stringValue => parseInt(stringValue) > 0 }
          />
          <button onClick={ () => sequenceNumberState.setSequenceNumber( (sequenceNumberState.sequenceNumber ?? 1)  + 1 ) } >+</button>
        </div>
        <label className={css.label_below}>Sequence Number</label>
      </div>
    </div>
  );
});

export const SequenceNumberFormFieldView = observer( ({sequenceNumberState}: {sequenceNumberState: SequenceNumberState}) => (
  <div className={css.form_item}>
    <div className={css.form_content}><SequenceNumberView sequenceNumberState={sequenceNumberState}  /></div>
    <div className={css.form_description}>If you need multiple passwords for a single website or service, change the sequence number to create additional passwords.</div>
  </div>
));
