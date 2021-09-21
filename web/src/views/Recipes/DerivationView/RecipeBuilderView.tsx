import css from "../Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeFieldFocusState, RecipeBuilderState, RecipeEditingMode } from "../RecipeBuilderState";
import { NumberPlusMinusView } from "../../basics/NumericTextFieldView";
import { EnhancedRecipeView } from "../EnhancedRecipeView";
//import { getRegisteredDomain } from "../../domains/get-registered-domain";
import { useContainerDimensions } from "../../../utilities/react-hooks/useContainerDimensions";
import { visibility } from "../../../utilities/visibility";
// import { CharButton } from "../../views/basics";

// TO DO

// Warning if json does not match fields alone

// LATER?

// Make json parser more resilient to errors?
// Add/remove field for other optional fields?

// Sites:
// [or]
// Purpose:

// Sequence number: none <edit>
// Maximum length: none <edit>
// JSON: auto-generated <customize>


export const RecipeFieldDescription = (props: React.PropsWithChildren<{}>) => (
  <div className={css.FieldToolTip}>{props.children}</div>
)

export const OldRecipeFieldView = observer ( ({
  label, for: htmlFor, children, focusState //, mayEdit, toggleEdit
}: React.PropsWithChildren<
  {
  focusState: RecipeFieldFocusState
  label: JSX.Element | string,
  for?: string,
  // mayEdit?: boolean,
  // toggleEdit?: () => void,
}>) => (
  <div
    className={focusState.isFieldInFocus ? css.RecipeFieldSelected : css.RecipeField}
    // onMouseEnter={ focus }
  >
    {children}
    <div className={css.RecipeFieldLabelRow}>
      {/* <div>&nbsp;</div> */}
      <label htmlFor={htmlFor}
        className={css.FieldLabel}
        onClick={ focusState.toggleFocus }
      >{ label }{ focusState.toggleFocus == null ? null : (<>&nbsp;&nbsp;&#9432;</>)}
      </label>
      {/* { mayEdit == null || toggleEdit == null ? (null) : (
      <div className={css.FieldEditButton}>
        <CharButton onClick={toggleEdit}><span style={mayEdit ? {} : {textDecorationLine: "line-through"}}>&#9998;</span></CharButton>
      </div> 
      ) } */}
    </div>
  </div>
));

export const BuilderFieldLabel = ({style, children, ...props}: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>) => (
  <label {...props} style={{
      fontSize: `min(2vh, 2vw)`, width: `20vw`,
      ...style
    }}>{ children}</label>
);

export const BuilderFieldValueContainer = ({children, ...props}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => (
  <div style={{
      fontSize: `min(2vh, 2vw)`, width: `50vw`,
    }} {...props}>{ children}</div>
);

export const BuilderFieldOptionalValue = observer ( ({
  value, children, ...optProps
}: React.PropsWithChildren<(
  {
    value: unknown,
  } & ({} | {
    defaultValueText: string,
    estDefaultValueButtonLabel: string,
    setDefaultValue: () => void,
}))>) => (
  <BuilderFieldValueContainer>{
    (value == null && "defaultValueText" in optProps) ? (
      <>
        {optProps.defaultValueText}
        <button onClick={optProps.setDefaultValue}>{optProps.setDefaultValue}</button>
      </>
    ) : children
  }
  </BuilderFieldValueContainer>
));

export const BuilderFieldContainer = ({children}: React.PropsWithChildren<{}>) => (
  <div>{children}</div>
);

export const OptionalRecipeFieldView = observer ( ({
  label, for: htmlFor, children, focusState //, mayEdit, toggleEdit
}: React.PropsWithChildren<
  {
  focusState: RecipeFieldFocusState
  label: string,
  for?: string
}>) => (
  <div
    className={focusState.isFieldInFocus ? css.RecipeFieldSelected : css.RecipeField}
    // onMouseEnter={ focus }
  >
    {children}
    <div className={css.RecipeFieldLabelRow}>
      <label htmlFor={htmlFor}
        className={css.FieldLabel}
        onClick={ focusState.toggleFocus }
      >{ label }{ focusState.toggleFocus == null ? null : (<>&nbsp;&nbsp;&#9432;</>)}
      </label>
    </div>
  </div>
));

export const RecipeFieldView = observer ( ({
  label, for: htmlFor, children, focusState //, mayEdit, toggleEdit
}: React.PropsWithChildren<
  {
  focusState: RecipeFieldFocusState
  label: JSX.Element | string,
  for?: string
}>) => (
  <div
    className={focusState.isFieldInFocus ? css.RecipeFieldSelected : css.RecipeField}
    // onMouseEnter={ focus }
  >
    {children}
    <div className={css.RecipeFieldLabelRow}>
      <label htmlFor={htmlFor}
        className={css.FieldLabel}
        onClick={ focusState.toggleFocus }
      >{ label }{ focusState.toggleFocus == null ? null : (<>&nbsp;&nbsp;&#9432;</>)}
      </label>
    </div>
  </div>
));

export const SiteFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  const field = "sites"
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  return (
    <RecipeFieldView
      focusState={fieldFocusState}
      label="sites"
      for={field}
    >
      <input id={field} type="text" spellCheck={false}
        className={css.PurposeOrHostNameTextField}
        size={40}
        value={state.associatedDomainsTextField ?? ""}
        placeholder=""
        ref={ e => { if (e != null) { e?.focus(); fieldFocusState.focus() } } }
        onPaste={ state.pasteIntoAssociatedDomainsTextField }
        onInput={ e => {state.setAssociatedDomainsTextField(e.currentTarget.value); fieldFocusState.focus(); }} 
        onFocus={ fieldFocusState.focus } />
    </RecipeFieldView>
  );
});

export const PurposeFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  const field = "purpose"
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  return (
    <RecipeFieldView
      focusState={fieldFocusState}
      label="purpose (required)"
      for={field}
    >
      <input id={field} type="text" spellCheck={false}
        className={css.PurposeOrHostNameTextField}
        size={40}
        value={state.purposeField ?? ""}
        placeholder=""
        ref={ e => { if (e != null) { e?.focus(); fieldFocusState.focus() } } }
        onPaste={ state.pasteIntoAssociatedDomainsTextField }
        onInput={ e => {state.setPurposeField(e.currentTarget.value); fieldFocusState.focus(); }} 
        onFocus={ fieldFocusState.focus } />
    </RecipeFieldView>
  );
});

export const SequenceNumberFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  const fieldFocusState = new RecipeFieldFocusState(state, "#");
  return (
    <RecipeFieldView focusState={fieldFocusState}
    label={"sequence #"} >
      <NumberPlusMinusView 
        className={css.SequenceNumberTextField}
        state={state.sequenceNumberState}
        placeholder={"1"}
        onFocusedOrChanged={fieldFocusState.focus} />
    </RecipeFieldView>
  )});

  export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
    if (state.type !== "Password" || state.lengthInCharsFieldHide || !state.mayEditLengthInChars) return null;
    const fieldFocusState = new RecipeFieldFocusState(state, "lengthInChars");
    return (
      <RecipeFieldView focusState={fieldFocusState} label={"max length"} >
        <NumberPlusMinusView
          className={css.LengthTextField}
          state={state.lengthInCharsState}
          placeholder={"none"}
          onFocusedOrChanged={fieldFocusState.focus} />
      </RecipeFieldView>
    );
  });

export const LengthInBytesFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Secret" || state.lengthInBytesFieldHide || !state.mayEditLengthInBytes) return null;
  const fieldFocusState = new RecipeFieldFocusState(state, "lengthInBytes");
  return (
    <RecipeFieldView focusState={fieldFocusState} label={"length (bytes)"} >
      <NumberPlusMinusView
        className={css.LengthTextField}
        state={state.lengthInBytesState}
        placeholder={"32"}
        onFocusedOrChanged={fieldFocusState.focus} />
    </RecipeFieldView>
  );
});

const RecipeFieldsHelpContentView = observer ( ( {state}: {state: RecipeBuilderState}) => {
  const secretType = state.type === "Password" ? "password" :
    state.type === "Secret" ? "secret" :
    "password, secret, or key"
  switch(state.fieldInFocus) {
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
    case "lengthInBytes": return (<>
      Set the number of bytes to generate for the {secretType}.
    </>);
    case "rawJson": return (<>
      The recipe's internal JSON format.
      <br/>
      <b>Be careful.</b>&nbsp;
      Do not edit it manually unless absolutely necessary.
      Changing even one character will change the {secretType}.
      If you can't re-create the exact recipe string used to generate a {secretType},
      you will be unable to regenerate it.
    </>);
    default: return state.type == null ? (<>
      Choose a recipe or template above.
    </>) : (<>
      The fields below change the recipe used to derive the {state.typeNameLc}.
    </>);
  }
});

export const RecipeFieldsHelpView = observer ( ( {state}: {state: RecipeBuilderState}) => (
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
      { state.usePurposeOrAllow === "allow" ? (
        <SiteFieldView state={state} />
      ) : state.usePurposeOrAllow === "purpose" ? (
        <PurposeFieldView state={state} />
      ) : null }
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
  const editable = state.editingMode === RecipeEditingMode.EditIncludingRawJson;
  const { width } = useContainerDimensions(editable ? textAreaComponentRef : divAreaComponentRef)
  const fieldFocusState = new RecipeFieldFocusState(state, "rawJson");
  return (
    <RecipeFieldView
      focusState={fieldFocusState}
//      toggleEdit={ state.toggleAllowEditingOfRawRecipe }
//      mayEdit={ editable }
      label="recipe in JSON format">
      <div className={css.FormattedRecipeBox}>
        <div className={css.FormattedRecipeUnderlay} style={{width: `${width ?? 0}px`}} >
          <EnhancedRecipeView recipeJson={state.recipeJson} />
        </div>
        { editable ? (
          <textarea
            spellCheck={false}
            ref={textAreaComponentRef}
            disabled={!editable}
            className={css.FormattedRecipeTextField}
            value={state.recipeJson ?? ""}
            style={{...(editable ? {} : {userSelect: "all"})}}
            onFocus={fieldFocusState.focus}
            onInput={ e => {state.setRecipeJson(e.currentTarget.value); fieldFocusState.focus(); }} 
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


export const RecipeBuilderView = observer( ( {state}: {state: RecipeBuilderState, hideHeader?: boolean}) => {
  return (
    <div className={css.RecipeFormFrame}
      style={{...visibility(state.type != null && state.editingMode !== RecipeEditingMode.NoEdit)}}
    >
      <RecipeFieldsHelpView {...{state}} />
      <RecipeBuilderFieldsView state={state} />
      { state.editingMode !== RecipeEditingMode.EditIncludingRawJson ? (<></>) : (
        <RecipeRawJsonView state={state} />
      )}
    </div>
  );
});
