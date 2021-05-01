import css from "./RecipeBuilderView.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, RecipeFieldType } from "./RecipeBuilderState";
import { NumberPlusMinusView } from "~views/basics/NumericTextFieldView";
//import { CharButton } from "../basics";

// export const RecipeTypeFieldView = observer( ({recipeTypeState}: {recipeTypeState: RecipeTypeState} ) => (
//   <div className={css.form_item}>
//     <div className={css.form_content}><RecipeTypeSelectorView recipeTypeState={recipeTypeState}  /></div>
//     <div className={css.form_description}>Help for Secret vs. Password.</div>
//   </div>
// ));

export const RecipeFieldDescription = (props: React.PropsWithChildren<{}>) => (
  <div className={css.FieldToolTip}>{props.children}</div>
)

export const RecipeFieldView = observer ( ({state, label, field, children}: React.PropsWithChildren<{
  state?: RecipeBuilderState,
  label: string,
//  description: string,
  field: RecipeFieldType,
}>) => (
  <div className={state?.helpToDisplay === field ? css.RecipeFieldSelected : css.RecipeField} onMouseOver={ state?.showHelpForFn(field) } >
    {children}
    <label
      className={css.FieldName}
      onClick={ () => state?.showHelpFor( state?.helpToDisplay === field ? undefined: field ) }
    >{ label }&nbsp;&nbsp;&#9432;
    </label>
  </div>
));

export const PurposeFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  if (!state.mayEditPurpose) {
    return null;
    // FIXME
  }
  const field = "purpose";
  const showHelp = state.showHelpForFn(field);
  return (
    <RecipeFieldView {...{state, field}} label="Purpose"
    //   description={`The purpose of the secret.
    //   If specified as a URL or comma-separate list of host names, the website(s) or app(s)
    //   associated with the URL will be able to request the generated ${state.type === "Password" ? "password" : "secrets/keys"}.
    // `}
    >
      <input type="text" className={css.host_name_text_field}
        value={state.purpose ?? ""}
        placeholder="https://example.com/path?search"
        onInput={ e => {state.setPurpose(e.currentTarget.value); showHelp(); }} 
        onFocus={ showHelp } />
    </RecipeFieldView>
  );
});

export const SequenceNumberFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  const field = "#";
  return (
    <RecipeFieldView {...{state, field}} label={"Sequence Number"}
    //   description={`If you need more than one ${
    //     state.type === "Password" ? "password" :
    //     state.type === "Secret" ? "secret" :
    //     "key"
    // } for this purpose, add a sequence numbers.`}  
    >
      <NumberPlusMinusView textFieldClassName={css.sequence_number_text_field} state={state.sequenceNumberState}
        onFocusedOrChanged={state.showHelpForFn(field)} />
    </RecipeFieldView>
  )});


export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Password" || !state.mayEditLengthInChars) return null;
  const field  = "lengthInChars";
  return (
    <RecipeFieldView {...{state, field}} label={"Max Length (chars)"}
//      description={`Apply a length-limit to the password.`}
    >
      <NumberPlusMinusView textFieldClassName={css.length_text_field} state={state.lengthInCharsState}
        onFocusedOrChanged={state.showHelpForFn(field)} />
    </RecipeFieldView>
  );
});

export const RecipeFieldHelpContent = observer ( ( {state}: {state: RecipeBuilderState}) => {
  const secretType = state.type === "Password" ? "password" :
    state.type === "Secret" ? "secret" :
    "key"
  switch(state.helpToDisplay) {
    case "#": return (
      <>If you need more than one {secretType} for this purpose, add a sequence number.</>);
    case "purpose": return (<>
        The purpose of the secret.
        If specified as a URL or comma-separate list of host names, the website(s) or app(s)
        associated with the URL will be able to request the generated {secretType}.
      </>);
    case "lengthInChars": return (<>
      Apply a length-limit to the password.
    </>);
    default: return (<></>);
  }
});


export const RecipeBuilderView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div className={css.RecipeBuilderBlock}>
      <div className={css.RecipeHelpBlock}>
        <div className={css.RecipeHelpContent}>
          <RecipeFieldHelpContent {...{state}} />
        </div>
      </div>
      <div className={css.RecipeFields}>
        <PurposeFieldView state={state} />
        <LengthInCharsFormFieldView state={state} />
        <SequenceNumberFormFieldView state={state} />
      </div>
    </div>
  );
});
