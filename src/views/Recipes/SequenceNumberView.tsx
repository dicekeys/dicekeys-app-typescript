import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { CharButton, CharButtonToolTip } from "../../views/basics";
import { RecipeBuilderState } from "./RecipeBuilderState";

interface NumericTextFieldProps {
  value?: number;
  setValue: (newValue: number) => void;
  className?: string;
  isValid?: (value: string) => boolean;
};

export const NumericTextField = (props: NumericTextFieldProps) => {
//  const [valueString, setValueString] = React.useState<string>("");
  const isValid = props.isValid ?? ((stringValue: string) => !isNaN(parseInt(stringValue)));
  const onInput = (target: HTMLInputElement): void => {
    const stringValue = target.value;
  if (isValid(stringValue)) {
      const numericValue = parseInt(stringValue);
      if (numericValue != props.value) {
        props.setValue( parseInt(stringValue) ) 
      }
    }
  }
  return (
    <input className={props.className} placeholder={"none"} type="text" value={props.value} onInput={ e => onInput(e.currentTarget) } />
  )
};

export const NumberPlusMinusView = observer( (props: {label: string, value?: number, minValue: number, setValue: (newNumber: number)=> any}) => {
  const {
    label, value, minValue, setValue
  } = props;
  return (
    <div className={css.field_row}>
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <CharButton style={{visibility: (value ?? minValue ) > minValue ? "visible" : "hidden"}}
            onClick={ () => setValue( Math.max(minValue, (value ?? minValue) - 1 )) }
            >-<CharButtonToolTip>- 1 = { value! - 1}</CharButtonToolTip></CharButton>
          <NumericTextField
            className={ css.sequence_number_text_field }
            setValue={setValue}
            value={value}
            isValid={ stringValue => parseInt(stringValue) >= minValue }
          />
          <CharButton onClick={ () => setValue( (value ?? (minValue-1))  + 1 ) }
            >+<CharButtonToolTip>+ 1 = { (value ?? (minValue-1)) + 1 }</CharButtonToolTip></CharButton>
        </div>
        <label className={css.label_below}>{label}</label>
      </div>
    </div>
  );
});

export interface SequenceNumberState {
  sequenceNumber?: number;
  setSequenceNumber: (newSequenceNumber: number | undefined) => void
}

export const SequenceNumberView = observer( ({state}: {state: SequenceNumberState}) => {
  return (
    <NumberPlusMinusView label={"Sequence Number"} minValue={1} value={state.sequenceNumber} setValue={state.setSequenceNumber} />
  );
});

export const SequenceNumberFormFieldView = observer( ({state}: {state: SequenceNumberState}) => (
  <div className={css.form_item}>
    <NumberPlusMinusView label={"Sequence Number"} minValue={1} value={state.sequenceNumber} setValue={state.setSequenceNumber} />
    <div className={css.form_description}>If you need multiple passwords for a single website or service, change the sequence number to create additional passwords.</div>
  </div>
));


export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Password" || !state.mayEditLengthInChars) return null;
  return (
    <div className={css.form_item}>
      <NumberPlusMinusView label={"Maximum Number of Characters"} minValue={16} value={state.lengthInChars} setValue={state.setLengthInChars} />
      <div className={css.form_description}>Set to limit the character length of the generated password.</div>
    </div>
  );
});
