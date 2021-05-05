import css from "./RecipeBuilderView.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, RecipeFieldType } from "./RecipeBuilderState";
import { NumberPlusMinusView } from "~views/basics/NumericTextFieldView";
import { describeRecipeType, RecipeDescriptionView } from "./RecipeDescriptionView";
import { SaveRecipeView } from "./SaveRecipeView";
import { LabeledEnhancedRecipeView } from "./EnhancedRecipeView";

export const RecipeFieldDescription = (props: React.PropsWithChildren<{}>) => (
  <div className={css.FieldToolTip}>{props.children}</div>
)

export const RecipeFieldView = observer ( ({state, label, field, children}: React.PropsWithChildren<{
  state?: RecipeBuilderState,
  label: string,
//  description: string,
  field: RecipeFieldType,
}>) => (
  <div
    className={state?.helpToDisplay === field ? css.RecipeFieldSelected : css.RecipeField}
    onMouseEnter={ state?.showHelpForFn(field) }
  >
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
    <RecipeFieldView {...{state, field}} label="Purpose" >
      <input type="text"
        className={css.PurposeOrHostNameTextField}
        size={32}
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
    <RecipeFieldView {...{state, field}} label={"Seq. #"} >
      <NumberPlusMinusView textFieldClassName={css.SequenceNumberTextField} state={state.sequenceNumberState}
        onFocusedOrChanged={state.showHelpForFn(field)} />
    </RecipeFieldView>
  )});


export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Password" || !state.mayEditLengthInChars) return null;
  const field  = "lengthInChars";
  return (
    <RecipeFieldView {...{state, field}} label={"Length"} >
      <NumberPlusMinusView textFieldClassName={css.LengthTextField} state={state.lengthInCharsState}
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
        The purpose of the {secretType}.
        If specified as a URL or comma-separate list of host names, the website(s) or app(s)
        associated with the URL will be able to request the generated {secretType}.
      </>);
    case "lengthInChars": return (<>
      Apply a length-limit to the password.
    </>);
    default: return state.type == null ? (<>
      Choose a recipe or template above.
    </>) : (<>
      The fields below change the recipe used to derive a {describeRecipeType(state.type)}.
    </>);
  }
});


export const RecipeBuilderView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div className={css.RecipeBuilderBlock}>
      <div className={css.RecipeFormFrame}>
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
      <div className={css.RecipeAndExplanationBlock} >
        <LabeledEnhancedRecipeView state={state} />
        <RecipeDescriptionView type={state.type} recipeJson={state.recipeJson} /> 
      </div>

      <SaveRecipeView state={state} />
    </div>
  );
});
