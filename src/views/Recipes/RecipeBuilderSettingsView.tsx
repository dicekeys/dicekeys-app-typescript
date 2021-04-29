import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { NumberPlusMinusView } from "~views/basics/NumericTextFieldView";

// export const RecipeTypeFieldView = observer( ({recipeTypeState}: {recipeTypeState: RecipeTypeState} ) => (
//   <div className={css.form_item}>
//     <div className={css.form_content}><RecipeTypeSelectorView recipeTypeState={recipeTypeState}  /></div>
//     <div className={css.form_description}>Help for Secret vs. Password.</div>
//   </div>
// ));

export const RecipeFieldDescription = (props: React.PropsWithChildren<{}>) => (
  <div className={css.form_description}>{props.children}</div>
)

export const RecipeFieldView = (props: React.PropsWithChildren<{
  label: string,
  description: string
}>) => (
  <div className={css.form_item}>
    <div className={css.form_content}>
      <div className={css.vertical_labeled_field}>
        {props.children}
        <label className={css.label_below}>{ props.label }</label>
      </div>
    </div>
    <RecipeFieldDescription>{ props.description }</RecipeFieldDescription>
  </div>
)

export const PurposeFieldView = observer( ({state}: {state: RecipeBuilderState} ) => {
  if (!state.mayEditPurpose) {
    return null;
    // FIXME
  }
  return (
    <RecipeFieldView
      label={"Purpose"}
      description={`The purpose of the secret.
      If specified as a URL or comma-separate list of host names, the website(s) or app(s)
      associated with the URL will be able to request the generated ${state.type === "Password" ? "password" : "secrets/keys"}.
    `}
    >
      <input type="text" className={css.host_name_text_field}
        value={state.purpose ?? ""}
        placeholder="https://example.com/path?search"
        onInput={ e => state.setPurpose(e.currentTarget.value) } />
    </RecipeFieldView>
  );
});

export const SequenceNumberFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  return (
    <RecipeFieldView
      label={"Sequence Number"}
      description={`If you need more than one ${
        state.type === "Password" ? "password" :
        state.type === "Secret" ? "secret" :
        "key"
    } for this purpose, add a sequence numbers.`}  
    >
      <NumberPlusMinusView textFieldClassName={css.sequence_number_text_field} state={state.sequenceNumberState} />
    </RecipeFieldView>
  )});


export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Password" || !state.mayEditLengthInChars) return null;
  return (
    <RecipeFieldView
      label={"Max Length (chars)"}
      description={`Require a length-limit to the password.`}
    >
      <NumberPlusMinusView textFieldClassName={css.length_text_field} state={state.lengthInCharsState} />
    </RecipeFieldView>
  );
});


export const RecipeBuilderSettingsView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div>
      {/* <RecipeTypeFieldView recipeTypeState={props.state} /> */}
      <PurposeFieldView state={state} />
      <LengthInCharsFormFieldView state={state} />
      <SequenceNumberFormFieldView state={state} />
    </div>
  );
});
