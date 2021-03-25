import css from "./derivation-view.module.css";
import React from "react";
import ReactDOM from "react-dom";
import {action, makeAutoObservable} from "mobx";
import { observer  } from "mobx-react";
import { DerivationRecipeTemplateList } from "../../dicekeys/derivation-recipe-templates";
import { addSequenceNumberToRecipeJson, DerivationRecipe } from "../../dicekeys/derivation-recipe";


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

interface SequenceNumberState {
  sequenceNumber: number;
  setSequenceNumber: (newSequenceNumber: number) => void
}

export const SequenceNumberView = observer( ({sequenceNumberState}: {sequenceNumberState: SequenceNumberState}) => {
  return (
    <div className={css.field_row}>
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <button onClick={ () => sequenceNumberState.setSequenceNumber( Math.max(1, sequenceNumberState.sequenceNumber - 1 )) } >-</button>
          <NumericTextField
            className={ css.sequence_number_text_field }
            value={ sequenceNumberState.sequenceNumber }
            setValue={ value => sequenceNumberState.sequenceNumber = value }
            isValid={ stringValue => parseInt(stringValue) > 0 }
          />
          <button onClick={ () => sequenceNumberState.setSequenceNumber( sequenceNumberState.sequenceNumber + 1 ) } >+</button>
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


interface RecipeBuilderState {
  error?: Error;
  recipe?: string;
}

export class RecipeBuilderForTemplateState implements RecipeBuilderState {
  template: DerivationRecipe;
  sequenceNumber: number;
  setSequenceNumber = action( (newSequenceNumber: number) => {
    this.sequenceNumber = newSequenceNumber;
  });

  get recipe(): string {
    return addSequenceNumberToRecipeJson(this.template.recipeJson, this.sequenceNumber);
  }

  constructor(template: DerivationRecipe, sequenceNumber: number = 1) {
    this.template = template;
    this.sequenceNumber = sequenceNumber;
    makeAutoObservable(this);
  }
}

export class DerivationViewState {

  sequenceNumber: number = 1;
  setSequenceNumber = (newSequenceNumber: number) => this.sequenceNumber = newSequenceNumber;

  constructor() { makeAutoObservable(this) }

}

export const RecipeBuilderForTemplateView = observer( ( props: {state: RecipeBuilderForTemplateState}) => {
  const state = props.state || new RecipeBuilderForTemplateState(DerivationRecipeTemplateList[0]);
  return (
    <div>
      <SequenceNumberFormFieldView sequenceNumberState={state} />
      <div>{ state.recipe }</div>
    </div>
  );
});

interface DerivationViewProps {
  state?: RecipeBuilderForTemplateState
}


export const DerivationView = observer( ( props: DerivationViewProps) => {
  const state = props.state || new RecipeBuilderForTemplateState(DerivationRecipeTemplateList[0]);
  return (
      <RecipeBuilderForTemplateView state={state} />
  );
});
