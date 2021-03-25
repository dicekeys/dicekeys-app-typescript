import css from "./derivation-view.module.css";
import React from "react";
import ReactDOM from "react-dom";
import {action, makeAutoObservable, observable} from "mobx";
import { observer  } from "mobx-react";
import { DerivationRecipeTemplateList } from "../../dicekeys/derivation-recipe-templates";
import { addSequenceNumberToRecipeJson, DerivationRecipe } from "../../dicekeys/derivation-recipe";
import { ComputeApiCommandWorker } from "../../workers/call-api-command-worker";
import { ApiCalls, PasswordJson } from "@dicekeys/dicekeys-api-js";


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


class PrecalculatedPasswords {
  private readonly computePasswordRequestWorker = new ComputeApiCommandWorker<ApiCalls.GetPasswordRequest>()
  private cache: {[key: string]: string | undefined} = {}

  setPassword = (recipe: string, password: string | undefined) => {
    this.cache[recipe] = password;
  }

  getPasswordForRecipe = (recipe: string) => {
    if (recipe in this.cache) {
      return this.cache[recipe];
    }
    this.setPassword(recipe, undefined);
    const request: ApiCalls.GetPasswordRequest = {
      command: ApiCalls.Command.getPassword,
      recipe
    };
    // console.log("Issuing request", this.seed, request);
    this.computePasswordRequestWorker.calculate({seedString: this.seedString, request}).then( result => {
      if ("exception" in result) {
        // this.throwException(result.exception, "calculating a password");
      } else {
        const password = (JSON.parse(result.passwordJson) as PasswordJson).password
        this.setPassword(recipe, password);
      }
    })
    return this.cache[recipe];
  }

  constructor(private seedString: string) {
    makeAutoObservable(this);
  }
}

interface RecipeBuilderState {
  error?: Error;
  recipe?: string;
  name?: string;
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

  get name(): string {
    return this.template.name + (
      this.sequenceNumber == 1 ? `` : ` (${this.sequenceNumber})`
    )
  }

  precalculatedPasswords: PrecalculatedPasswords;

  get password(): string | undefined {
    return this.precalculatedPasswords.getPasswordForRecipe(this.recipe);
  }

  constructor(seedString: string, template: DerivationRecipe, sequenceNumber: number = 1) {
    this.template = template;
    this.sequenceNumber = sequenceNumber;
    this.precalculatedPasswords = new PrecalculatedPasswords(seedString)
    makeAutoObservable(this);
  }
}


export class DerivationViewState {

  sequenceNumber: number = 1;
  setSequenceNumber = (newSequenceNumber: number) => this.sequenceNumber = newSequenceNumber;

  constructor() { makeAutoObservable(this) }
}

export const RecipeBuilderForTemplateView = observer( ( props: {seedString: string, state: RecipeBuilderForTemplateState}) => {
  return (
    <div>
      <div>Recipe for {props.state.name}</div>
      <SequenceNumberFormFieldView sequenceNumberState={props.state} />
      <div>{ props.state.recipe }</div>
      <div>{ props.state.password ?? ""  }</div>
    </div>
  );
});

interface DerivationViewProps {
  seedString: string;
  state?: RecipeBuilderForTemplateState;
}


export const DerivationView = observer( ( props: DerivationViewProps) => {
  const state = props.state || new RecipeBuilderForTemplateState(props.seedString, DerivationRecipeTemplateList[0]);
  return (
      <RecipeBuilderForTemplateView seedString={props.seedString} state={state} />
  );
});
