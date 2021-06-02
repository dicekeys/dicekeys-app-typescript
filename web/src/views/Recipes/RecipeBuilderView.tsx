import css from "./Recipes.module.css";
import {ButtonsCSS} from "../../css";
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

// TO DO

// Warning if json does not match fields alone

// LATER?

// Make json parser more resilient to errors?
// Add/remove field for other optional fields?

export const RecipeFieldDescription = (props: React.PropsWithChildren<{}>) => (
  <div className={css.FieldToolTip}>{props.children}</div>
)

export const RecipeFieldView = observer ( ({state, label, field, children}: React.PropsWithChildren<{
  state?: RecipeBuilderState,
  label: JSX.Element | string,
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
    <RecipeFieldView {...{state, field}} label="purpose (required)" >
      <input type="text" spellCheck={false}
        className={css.PurposeOrHostNameTextField}
        size={40}
        value={state.purposeField ?? ""}
        placeholder=""
        ref={ e => { if (e != null) { e?.focus(); showHelp() } } }
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
    <RecipeFieldView {...{state, field}} label={"sequence #"} >
      <NumberPlusMinusView 
        textFieldClassName={css.SequenceNumberTextField}
        state={state.sequenceNumberState}
        placeholder={"1"}
        onFocusedOrChanged={state.showHelpForFn(field)} />
    </RecipeFieldView>
  )});

  export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
    if (state.type !== "Password" || !state.mayEditLengthInChars) return null;
    const field  = "lengthInChars";
    return (
      <RecipeFieldView {...{state, field}} label={"max length"} >
        <NumberPlusMinusView
          textFieldClassName={css.LengthTextField}
          state={state.lengthInCharsState}
          placeholder={"none"}
          onFocusedOrChanged={state.showHelpForFn(field)} />
      </RecipeFieldView>
    );
  });

export const LengthInBytesFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Secret" || !state.mayEditLengthInBytes) return null;
  const field  = "lengthInBytes";
  return (
    <RecipeFieldView {...{state, field}} label={"length (bytes)"} >
      <NumberPlusMinusView
        textFieldClassName={css.LengthTextField}
        state={state.lengthInBytesState}
        placeholder={"32"}
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
        If this {secretType} is for a website, paste its web address (URL) into the purpose field.<br/>
        Be careful not to create your own purpose and forget it, as you cannot
        re-create the {secretType} without it.
      </>);
    case "lengthInChars": return (<>
      Limit the length of the generated password to a maximum number of characters.
    </>);
    case "rawJson": return (<>
      The recipe's internal JSON format.
      <br/>
      <b>Be careful.</b>&nbsp;
      Do not edit it manually unless absolutely necessary.
      Changing even one character will change the {secretType}.
      If you can't re-create the exact recipe string used to generate a {secretType},
      you will be unable to regenerate it.
      { state.allowEditingOfRawRecipe ? null : (
        <button
          onClick={ () => state.setAllowEditingOfRawRecipe(true) }
          className={ButtonsCSS.SubtleButton} >
            edit it anyway
        </button>
      )}
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
  const textAreaComponentRef = React.useRef<HTMLTextAreaElement>(null);
  const divAreaComponentRef = React.useRef<HTMLDivElement>(null);
  const editable = state.editing && state.allowEditingOfRawRecipe;
  const { width } = useContainerDimensions(editable ? textAreaComponentRef : divAreaComponentRef)

  const field = "rawJson";
  return (
    <RecipeFieldView {...{state, field}}
      label="recipe in JSON format">
      <div className={css.FormattedRecipeBox}>
        <div className={css.FormattedRecipeUnderlay} style={{width: `${width ?? 0}px`}} >
          <EnhancedRecipeView recipeJson={state.recipeJson} />
        </div>
        { editable ? (
          <textarea spellCheck={false}
          ref={textAreaComponentRef}
          disabled={!state.editing}
          className={css.FormattedRecipeTextField}
          value={state.recipeJson ?? ""}
          style={{...(state.editing ? {} : {userSelect: "all"})}}
          onInput={ e => {state.setRecipeJson(e.currentTarget.value); }} 
          />
        ) : (
          <div
            ref={divAreaComponentRef}
            className={css.FormattedRecipeDisabledDiv}
            style={{userSelect: "all"}}
          >{state.recipeJson ?? (<>&nbsp;</>)}</div>   
        ) }
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
        <RecipeDescriptionView state={state} /> 
      </div>
    </div>
  );
});
