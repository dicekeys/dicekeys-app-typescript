import css from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { NumberPlusMinusView } from "../../views/basics/NumericTextFieldView";
import { RecipeDescriptionView } from "./RecipeDescriptionView";
import { SaveRecipeView } from "./SaveRecipeView";
import { LabeledEnhancedRecipeView } from "./EnhancedRecipeView";
import { describeRecipeType } from "./DescribeRecipeType";
import { RecipeTypeSelectorView } from "./RecipeTypeSelectorView";
import { RecipeFieldType } from "../../dicekeys/ConstructRecipe";

// IN PROGRESS

// Restyling (location of load, edit button, etc.)

// TO DO

// Include *. in purpose?
// (including/excluding subdomains on all strings?)
// Saved recipes and built-in recipes default to non-edit mode, edit button loads them
// Clear button to empty recipe
// Delete recipe menu?

// Raw recipe editor with switch

// Save button checks for overwrites on name

// compare resulting recipeJson to see if still matches template/saved version

// limit to one calculation at a time

// LATER?

// Add/remove field for optional fields?

// DONE

// Ensure lengthInBytes appears for secrets view
// Recalculate suggested names by mapping purpose strings back to templates
// Load templates directly into fields





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
        value={state.purposeField ?? ""}
        placeholder="https://example.com/path?search"
        onInput={ e => {state.setPurposeField(e.currentTarget.value); showHelp(); }} 
        onFocus={ showHelp } />
    </RecipeFieldView>
  );
});

// export const TypeFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
//   const field = "#";
//   return (
//     <RecipeFieldView {...{state, field}} label={"Seq. #"} >
//       <select
//         value={state.type}
//         onClick={ state.showHelpForFn(field) }
//         onChange={ (e) => {
//           const type = e.currentTarget.value as DerivationRecipeType | undefined;
//           state.setType(type);
//           state.showHelpFor(field);
//       }}>
//         <option key={"none"} value="" ></option>
//         { recipeTypes.map( ({key, name}) => (
//           <option key={key} value={key} >{name}</option>
//         )) }
//       </select>
//     </RecipeFieldView>
//   )});

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
      <RecipeFieldView {...{state, field}} label={"Length (chars)"} >
        <NumberPlusMinusView textFieldClassName={css.LengthTextField} state={state.lengthInCharsState}
          onFocusedOrChanged={state.showHelpForFn(field)} />
      </RecipeFieldView>
    );
  });

export const LengthInBytesFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Secret" || !state.mayEditLengthInBytes) return null;
  const field  = "lengthInBytes";
  return (
    <RecipeFieldView {...{state, field}} label={"Length (bytes)"} >
      <NumberPlusMinusView textFieldClassName={css.LengthTextField} state={state.lengthInBytesState}
        onFocusedOrChanged={state.showHelpForFn(field)} />
    </RecipeFieldView>
  );
});

export const RecipeFieldHelpContent = observer ( ( {state}: {state: RecipeBuilderState}) => {
  const secretType = state.type === "Password" ? "password" :
    state.type === "Secret" ? "secret" :
    "password, secret, or key"
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
      The fields below change the recipe used to derive the {describeRecipeType(state.type).toLocaleLowerCase()}.
    </>);
  }
});


export const RecipeBuilderView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div className={css.RecipeBuilderBlock}>
      <div className={css.RecipeFormFrame}>
        <RecipeTypeSelectorView {...{state}} />
        <div className={css.RecipeHelpBlock}>
          <div className={css.RecipeHelpContent}>
            <RecipeFieldHelpContent {...{state}} />
          </div>
        </div>
        <div className={css.RecipeFields}>
          <PurposeFieldView state={state} />
          <LengthInCharsFormFieldView state={state} />
          <LengthInBytesFormFieldView state={state} />
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
