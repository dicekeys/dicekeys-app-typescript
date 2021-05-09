import React from "react";
import { observer  } from "mobx-react";
import css from "./RecipeBuilderView.css";
import { CharButton, CharButtonToolTip, OptionallyObscuredTextView, SecretFieldsCommonObscureButton } from "../basics";
import { GlobalSharedToggleState } from "../../state";
import { action } from "mobx";
import { DerivedFromRecipeState, OutputFormats, OutputFormat } from "./DerivedFromRecipeState";



export const DerivedFromRecipeView = observer( ({state}: {state: DerivedFromRecipeState}) => {
  const {recipe, derivedValue} = state;
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
            <select
              className={css.SelectDerivedField}
              value={state.outputFieldForType[type]}
              onChange={ (e) => state.setOutputField(e.currentTarget.value as OutputFormat<typeof type>) }
            >
              {OutputFormats[type].map( (format: string) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
            <span style={{width: "1rem"}}></span>
            <CharButton
                hidden={derivedValue == null}
                onClick={copyToClipboard}
              >&#128203;<CharButtonToolTip>Copy {state.outputFieldForType[type].toLocaleLowerCase()} to clipboard</CharButtonToolTip>
            </CharButton>
            <span style={{width: "1rem"}}></span>
            <SecretFieldsCommonObscureButton />
            </div>
          <div className={css.DerivedValue}>
            <OptionallyObscuredTextView value={derivedValue} obscureValue={ GlobalSharedToggleState.ObscureSecretFields.value } />
          </div>
        </>
      )}
    </div>
  );
  }
);
