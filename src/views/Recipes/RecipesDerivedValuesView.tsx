import React from "react";
import { observer  } from "mobx-react";
import css from "./RecipeBuilderView.css";
import { CopyButton, OptionallyObscuredTextView, SecretFieldsCommonObscureButton } from "../basics";
import { GlobalSharedToggleState } from "../../state";
import { RecipeBuilderState, OutputFormats, OutputFormat } from "./RecipeBuilderState";

export const RecipesDerivedValuesView = observer( ( props: {state: RecipeBuilderState}) => {
  const type = props.state.type;
  const derivedValue = props.state.derivedValue;
  return (
    <div className={css.DerivedValueBlock}>
      {type == null ? null : (
        <>
          <div className={css.DerivedValueHeader}>
            <select
              className={css.SelectDerivedField}
              value={props.state.outputFieldForType[type]}
              onChange={ (e) => props.state.setOutputField(e.currentTarget.value as OutputFormat<typeof type>) }
            >
              {OutputFormats[type].map( (format: string) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
            <span style={{width: "1rem"}}></span>
            <CopyButton value={derivedValue} />
            <span style={{width: "1rem"}}></span>
            <SecretFieldsCommonObscureButton />
            </div>
          {/* <textarea
            contentEditable={false}
            className={css.DerivedValue}
            value={GlobalSharedToggleState.ObscureSecretFields.value ? defaultObscuringFunction(derivedValue ?? "") : derivedValue}
          /> */}
          <div className={css.DerivedValue}>
            <OptionallyObscuredTextView value={derivedValue} obscureValue={ GlobalSharedToggleState.ObscureSecretFields.value } />
          </div>
        </>
      )}
    </div>
  );
  }
);
