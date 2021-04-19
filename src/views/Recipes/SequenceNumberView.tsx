import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { NumberPlusMinusView, NumericTextFieldState } from "../../views/basics/NumericTextFieldView";

export interface SequenceNumberState {
  sequenceNumber?: number;
  setSequenceNumber: (newSequenceNumber: number | undefined) => void
}

export const SequenceNumberView = observer( (props: {state: NumericTextFieldState}) => {
  return (
    <NumberPlusMinusView label={"Sequence Number"} {...props} />
  );
});

export const SequenceNumberFormFieldView = observer( (props: {state: NumericTextFieldState}) => {
  return (
    <div className={css.form_item}>
      <NumberPlusMinusView label={"Sequence Number"} {...props} />
      <div className={css.form_description}>If you need multiple passwords for a single website or service, change the sequence number to create additional passwords.</div>
    </div>
  )});


export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Password" || !state.mayEditLengthInChars) return null;
  return (
    <div className={css.form_item}>
      <NumberPlusMinusView label="Max Length (chars)" state={state.lengthInCharsState} />
      <div className={css.form_description}>Set to limit the character length of the generated password.</div>
    </div>
  );
});
