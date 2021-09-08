import React from "react";
import { observer  } from "mobx-react";
import css from "./Recipes.module.css";
import { CharButton, CharButtonToolTip, OptionallyObscuredTextView, SecretFieldsCommonObscureButton } from "../basics";
import { ToggleState } from "../../state";
import { action } from "mobx";
import { DerivedFromRecipeState, OutputFormats, OutputFormat } from "./DerivedFromRecipeState";
import { DerivationRecipeType } from "../../dicekeys/StoredRecipe";
import { RecipeBuilderState } from "./RecipeBuilderState";


const Bip39OutputView = ({bip39String, obscureValue}: {bip39String: string, obscureValue: boolean}) => {
  let bip39WordArray = bip39String.split(" ");
  if (obscureValue) {
    bip39WordArray = bip39WordArray.map( plaintextWord => "************".substr(0, plaintextWord.length) ).sort();
  }
  return (
    <div className={css.Bip39Field}>{
      bip39WordArray.map( (word, index) => (
        <span key={index} className={css.Bip39WordSpan}>
          { // put spaces between words by inserting space before every word but first
            index !== 0 ? (<>&nbsp;</>) : null}
          <div key={index} className={css.Bip39WordAndIndex}>
            <div className={css.Bip39WordAboveIndex}>{word}</div>
            <div className={css.Bip39IndexBelowWord}>{`${index+1}`}</div>
          </div>
        </span>
      ))
    }</div>
  )
}

const SelectDerivedOutputType = observer( ({type, state}: {type?: DerivationRecipeType, state: DerivedFromRecipeState}) => (
  <select
    className={css.SelectRecipeType}
    disabled={type==null}
    value={ (type == null) ? "NullType" : state.outputFieldForType[type]}
    onChange={ (e) => state.setOutputField(e.currentTarget.value as OutputFormat) }
  >
    { type == null ? (
        <option value="NullType" disabled={true}>format</option>
      ) : 
        OutputFormats[type].map( (format: string) => (
          <option key={format} value={format}>{format}</option>
        ))  
    }
  </select>
));

export const DerivedFromRecipeView = observer( ({recipeBuilderState, state}: {
    recipeBuilderState: RecipeBuilderState,
    state: DerivedFromRecipeState
  }) => {
  const {recipeState: recipe, derivedValue} = state;
  const {type} = recipe;
  const copyToClipboard = action ( () => {
    if (derivedValue != null) {
      navigator.clipboard.writeText(derivedValue);
    }
    // FUTURE - provide user notification that copy happened.
  });
  return (
    <div className={css.DerivedValueBlock}>
        <div className={css.DerivedValueHeader}>
          <SelectDerivedOutputType type={type} state={state} />
          <span style={{width: "1rem"}}></span>
          <span style={{width: "1rem"}}></span>
          { type == null ? null : (
            <>
            <CharButton
                hidden={derivedValue == null || type == null}
                onClick={copyToClipboard}
              >&#128203;<CharButtonToolTip>Copy {type == null ? "" : state.outputFieldForType[type].toLocaleLowerCase()} to clipboard</CharButtonToolTip>
            </CharButton>
            <SecretFieldsCommonObscureButton />
            </>
          )}
          </div>
        { type === "Secret" && state.outputFieldForType[type] === "BIP39" && derivedValue != null ?
          (<Bip39OutputView bip39String={derivedValue} obscureValue={ ToggleState.ObscureSecretFields.value } />)
          : (
          <div className={css.DerivedValue}>
            { !recipeBuilderState.wizardComplete ? (
              <><i style={{color: "rgba(0,0,0,0.5"}}>A secret to be created by applying a recipe to your DiceKey</i></>
            ) : (
              <OptionallyObscuredTextView value={derivedValue} obscureValue={ ToggleState.ObscureSecretFields.value } />
            )}
          </div>
        )}
    </div>
  );
  }
);
