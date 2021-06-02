import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { NumberPlusMinusView } from "../../views/basics/NumericTextFieldView";
import { RecipeDescriptionView } from "./RecipeDescriptionView";
import { EnhancedRecipeView } from "./EnhancedRecipeView";
import { describeRecipeType } from "./DescribeRecipeType";
import { SelectAndSaveTableHeaderView } from "./SelectAndSaveTableHeaderView";
import { RecipeFieldType } from "../../dicekeys/ConstructRecipe";
import { getRegisteredDomain } from "../../domains/get-registered-domain";
import { useContainerDimensions } from "../../utilities/react-hooks/useContainerDimensions";

// IN PROGRESS

// Restyling (location of load, edit, delete, etc.)

// TO DO

// Warning if json does not match fields alone

// LATER?

// Make json parser more resilient to errors?
// Add/remove field for other optional fields?

// DONE

// limit to one calculation at a time
// Bug Purpose field switching from hosts/purpose leaves both in JSON
// handle overflow text in formatted recipeJson
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
      <input type="text" spellCheck={false}
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
    case "rawJson": return (<>
      This is the recipe's internal JSON format for use only when the provided fields are insufficient.
      <br/>
      <b>Be careful.</b>&nbsp;
      Changing even one character will change the {secretType}.
      If you can't re-create the exact recipe string used to generate a {secretType}, you will be unable to regenerate it.
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
      <div style={{display: "block"}}>
        <RecipeFieldsHelpContentView state={state} />
      </div>
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
  const componentRef = React.useRef<HTMLTextAreaElement>(null);
  const { width } = useContainerDimensions(componentRef)

  const field = "rawJson";
  return (
    <RecipeFieldView {...{state, field}} label="Recipe in JSON format" >
      <div className={css.FormattedRecipeBox}>
        <div className={css.FormattedRecipeUnderlay} style={{width: `${width ?? 0}px`}} >
          <EnhancedRecipeView recipeJson={state.recipeJson} />
        </div>
        <textarea spellCheck={false} ref={componentRef}
          disabled={!state.editing}
          className={css.FormattedRecipeTextField}
          value={state.recipeJson ?? ""}
          onInput={ e => {state.setRecipeJson(e.currentTarget.value); }} 
        />
      </div>
    </RecipeFieldView>
  );
});
export const RecipeRawJsonView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div className={css.RecipeSingleFieldRow}>
      <JsonFieldView state={state} />
    </div>
  );
});


export const RecipeBuilderView = observer( ( {state}: {state: RecipeBuilderState}) => {
  if (state.type == null) return (<></>);
  return (
    <div className={css.RecipeBuilderBlock}>
      <SelectAndSaveTableHeaderView {...{state}} />
      <div className={css.RecipeFormFrame}>
        { !state.editing ? (<></>) : (
          <>
          <RecipeFieldsHelpView {...{state}} />
          <RecipeBuilderFieldsView state={state} />
          </>
        )}
        <RecipeRawJsonView state={state} /> 
      </div>
      <div className={css.RecipeAndExplanationBlock} >
        {/* <LabeledEnhancedRecipeView state={state} /> */}
        <RecipeDescriptionView type={state.type} recipeJson={state.recipeJson} /> 
      </div>
    </div>
  );
});
