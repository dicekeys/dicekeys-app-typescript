import React from "react";
import { observer  } from "mobx-react";
import css from "./Recipes.module.css";
import { CharButton, CharButtonToolTip, OptionallyObscuredTextView, SecretFieldsCommonObscureButton } from "../basics";
import { ToggleState } from "../../state";
import { action } from "mobx";
import { DerivedFromRecipeState, OutputFormats, OutputFormat } from "./DerivedFromRecipeState";
import { DerivationRecipeType } from "../../dicekeys/StoredRecipe";


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

const SelectDerivedOutputType = observer( ({type, state}: {type: DerivationRecipeType, state: DerivedFromRecipeState}) => (
  <select
    className={css.SelectRecipeType}
    value={state.outputFieldForType[type]}
    onChange={ (e) => state.setOutputField(e.currentTarget.value as OutputFormat) }
  >
    {OutputFormats[type].map( (format: string) => (
      <option key={format} value={format}>{format}</option>
    ))}
  </select>
));

export const DerivedFromRecipeView = observer( ({state}: {state: DerivedFromRecipeState}) => {
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
      {type == null ? null : (
        <>
          <div className={css.DerivedValueHeader}>
            <SelectDerivedOutputType type={type} state={state} />
            <span style={{width: "1rem"}}></span>
            <CharButton
                hidden={derivedValue == null}
                onClick={copyToClipboard}
              >&#128203;<CharButtonToolTip>Copy {state.outputFieldForType[type].toLocaleLowerCase()} to clipboard</CharButtonToolTip>
            </CharButton>
            <span style={{width: "1rem"}}></span>
            <SecretFieldsCommonObscureButton />
            </div>
          { type === "Secret" && state.outputFieldForType[type] === "BIP39" && derivedValue != null ?
            (<Bip39OutputView bip39String={derivedValue} obscureValue={ ToggleState.ObscureSecretFields.value } />)
            : (
            <div className={css.DerivedValue}>
              <OptionallyObscuredTextView value={derivedValue} obscureValue={ ToggleState.ObscureSecretFields.value } />
            </div>
          )}
        </>
      )}
    </div>
  );
  }
);
