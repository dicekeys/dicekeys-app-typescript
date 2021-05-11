import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { NumberPlusMinusView } from "../../views/basics/NumericTextFieldView";
import { RecipeDescriptionView } from "./RecipeDescriptionView";
import { LabeledEnhancedRecipeView } from "./EnhancedRecipeView";
import { describeRecipeType } from "./DescribeRecipeType";
import { RecipeTypeSelectorView } from "./RecipeTypeSelectorView";
import { RecipeFieldType } from "../../dicekeys/ConstructRecipe";
import { getRegisteredDomain } from "~domains/get-registered-domain";

// IN PROGRESS

// Restyling (location of load, edit, delete, etc.)

// TO DO

// limit to one calculation at a time

// LATER?

// Add/remove field for optional fields?

// DONE

// Raw recipe editor with switch
// Delete recipe button
// Saved recipes and built-in recipes default to non-edit mode, edit button loads them
// Fields automatically added to name
// Include *. in purpose?
// (including/excluding subdomains on all strings?)
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
  field?: RecipeFieldType,
}>) => (
  <div
    className={state?.helpToDisplay === field ? css.RecipeFieldSelected : css.RecipeField}
    onMouseEnter={ state?.showHelpForFn(field) }
  >
    {children}
    <label
      className={css.FieldName}
      onClick={ () => state?.showHelpFor( state?.helpToDisplay === field ? undefined: field ) }
    >{ label }{field == null ? null : (<>&nbsp;&nbsp;&#9432;</>)}
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
        placeholder=""
        onPaste={ e => {
          // If pasting a URL, paste only the domain
          const text = e.clipboardData.getData("text")
          if (text.startsWith("http://") || text.startsWith("https://")) {
            const domain = getRegisteredDomain(text);
            if (domain != null) {
              state.setPurposeField(domain);
              e.preventDefault();
            }
          }
        }}
        onInput={ e => {state.setPurposeField(e.currentTarget.value); showHelp(); }} 
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

const RecipeFieldsHelpContentView = observer ( ( {state}: {state: RecipeBuilderState}) => {
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

const RecipeFieldsHelpView = observer ( ( {state}: {state: RecipeBuilderState}) => (
  <div className={css.RecipeHelpBlock}>
    <div className={css.RecipeHelpContent}>
      <RecipeFieldsHelpContentView state={state} />
    </div>
  </div>
));

export const RecipeBuilderFieldsView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div className={css.RecipeFields}>
      <PurposeFieldView state={state} />
      <LengthInCharsFormFieldView state={state} />
      <LengthInBytesFormFieldView state={state} />
      <SequenceNumberFormFieldView state={state} />
    </div>
  );
});


export const JsonFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  return (
    <RecipeFieldView {...{state}} label="Recipe in JSON format" >
      <input type="text"
        className={css.JsonTextField}
        value={state.recipeJsonField ?? ""}
        onInput={ e => {state.setRecipeJson(e.currentTarget.value); }} 
    />
    </RecipeFieldView>
  );
});
export const RecipeRawJsonView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div className={css.RecipeFields}>
      <JsonFieldView state={state} />
    </div>
  );
});


export const RecipeBuilderView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div className={css.RecipeBuilderBlock}>
      <RecipeTypeSelectorView {...{state}} />
        { state.editingMode == null ? (<></>) : (
        <div className={css.RecipeFormFrame}>
          { state.editingMode === "fields" ? (
            <>
              <RecipeFieldsHelpView {...{state}} />
              <RecipeBuilderFieldsView state={state} />
            </>
          ) : state.editingMode === "json" ? 
              <RecipeRawJsonView state={state} /> :
            <></>
          }
        </div>
        )}
      {state.type == null ? (<></>) : (
        <div className={css.RecipeAndExplanationBlock} >
          <LabeledEnhancedRecipeView state={state} />
          <RecipeDescriptionView type={state.type} recipeJson={state.recipeJson} /> 
        </div>
      )}
    </div>
  );
});
