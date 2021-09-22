import css from "../Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeFieldFocusState, RecipeBuilderState, RecipeEditingMode } from "../RecipeBuilderState";
import { NumberPlusMinusView } from "../../basics/NumericTextFieldView";
import { visibility } from "../../../utilities/visibility";
import * as Dimensions from "./Dimensions";
import * as Colors from "./Colors";
import { describeRecipeType } from "../DescribeRecipeType";
import { EnhancedRecipeView } from "../EnhancedRecipeView";

const fieldEditorWidth = Math.min(80, Dimensions.ScreenWidthPercentUsed)
const labelWidthVw = 10;
const labelValueMarginVw = 0.5;
const valueElementWidthVw = fieldEditorWidth - (labelWidthVw + labelValueMarginVw);

const fieldBorderColor = `rgba(128, 128, 128, 0.2)`;

const BuilderFieldLabel = ({style, children, ...props}: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>) => (
  <label {...props} style={{
      width: `${labelWidthVw}vw`,
      textAlign: "right",
      paddingRight: `${labelValueMarginVw}vw`,
      marginRight: `${labelValueMarginVw}vw`,
      borderRight: `1px rgba(128,128,128, 0.5) solid`,
      ...style
    }}>{ children}</label>
);

const ContainerForOptionalFieldValue = observer ( ({
  value, children, ...optProps
}: React.PropsWithChildren<(
  {
    value: unknown,
    defaultValueText: string,
    setDefaultValueButtonLabel: string,
    setDefaultValue: () => void,
})>) => (
  <>{
    (value == null) ? (
      <>
        <span style={{color: "rgba(128,128,128,1)"}}>{optProps.defaultValueText}</span>
        <button
          onClick={optProps.setDefaultValue}
          style={{marginLeft: `1rem`}}
        >{optProps.setDefaultValueButtonLabel}</button>
      </>
    ) : children
  }
  </>
));

const BuilderFieldContainer = ({children}: React.PropsWithChildren<{}>) => (
  <div style={{
    display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "baseline",
    fontSize: `min(2vh, 2vw)`,
    marginTop: `0.25vh`,
  }}>{children}</div>
);

const FieldUnderlineStyle = (textDecorationColor: Colors.All): React.CSSProperties => ({
  textDecorationColor,
  textDecorationLine: "underline",
  textDecorationThickness: `2px`,
  textDecorationStyle: "solid",
});

export const SiteFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  if (state.associatedDomainsTextField == null) return null;
  const field = "sites"
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>sites</BuilderFieldLabel>
      <input id={field} type="text" spellCheck={false}
        className={css.host_name_input_span}
        style={{
          width: `${valueElementWidthVw}vw`,
          borderColor: fieldBorderColor,
          ...FieldUnderlineStyle(Colors.PurposeOrSites),
        }}
        value={state.associatedDomainsTextField ?? ""}
        placeholder=""
        ref={ e => { if (e != null) { e?.focus(); fieldFocusState.focus() } } }
        onPaste={ state.pasteIntoAssociatedDomainsTextField }
        onInput={ e => {state.setAssociatedDomainsTextField(e.currentTarget.value); fieldFocusState.focus(); }} 
        onFocus={ fieldFocusState.focus } />
    </BuilderFieldContainer>
  );
});

export const PurposeFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  if (state.purposeField == null) return null;
  const field = "purpose"
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>Purpose:</BuilderFieldLabel>
      <input id={field} type="text" spellCheck={false}
        className={css.host_name_input_span}
        size={40}
        value={state.purposeField ?? ""}
        placeholder=""
        style={{
          width: `${valueElementWidthVw}vw`,
          borderColor: fieldBorderColor,
          ...FieldUnderlineStyle(Colors.PurposeOrSites),
        }}
        ref={ e => { if (e != null) { e?.focus(); fieldFocusState.focus() } } }
        onPaste={ state.pasteIntoAssociatedDomainsTextField }
        onInput={ e => {state.setPurposeField(e.currentTarget.value); fieldFocusState.focus(); }} 
        onFocus={ fieldFocusState.focus } />
    </BuilderFieldContainer>
  );
});

export const SequenceNumberFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  const field = "#"
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>sequence #</BuilderFieldLabel>
      <ContainerForOptionalFieldValue
        value={state.sequenceNumberState.numericValue}
        defaultValueText={"none"}
        setDefaultValue={state.sequenceNumberState.increment }
        setDefaultValueButtonLabel={"add"}
      >
        <NumberPlusMinusView
          id={field}
          className={css.SequenceNumberTextField}
          state={state.sequenceNumberState}
          placeholder={"1"}
          style={{
            borderColor: fieldBorderColor,
            ...FieldUnderlineStyle(Colors.SequenceNumber),
          }}
          onFocusedOrChanged={fieldFocusState.focus} />
      </ContainerForOptionalFieldValue>
    </BuilderFieldContainer>    
    // <RecipeFieldView focusState={fieldFocusState}
  )});

  export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
    if (state.type !== "Password" || state.lengthInCharsFieldHide || !state.mayEditLengthInChars) return null;
    const field = "lengthInChars";
    const fieldFocusState = new RecipeFieldFocusState(state, field);
    return (
      <BuilderFieldContainer >
        <BuilderFieldLabel htmlFor={field}>max length</BuilderFieldLabel>
        <ContainerForOptionalFieldValue
          value={state.lengthInCharsState.numericValue}
          defaultValueText={"no limit"}
          setDefaultValue={() => state.lengthInCharsState.setValue(64)}
          setDefaultValueButtonLabel={"add"}
        >
          <NumberPlusMinusView
            id={field}
            className={css.LengthTextField}
            state={state.lengthInCharsState}
            placeholder={"none"}
            style={{
              borderColor: fieldBorderColor,
              ...FieldUnderlineStyle(Colors.LengthLimit),
            }}
            onFocusedOrChanged={fieldFocusState.focus} />
          <i>characters</i>
        </ContainerForOptionalFieldValue>
      </BuilderFieldContainer>
    );
  });

export const LengthInBytesFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Secret" || state.lengthInBytesFieldHide || !state.mayEditLengthInBytes) return null;
  const field = "lengthInBytes";
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  return (
    <BuilderFieldContainer >
      <BuilderFieldLabel htmlFor={field}>length</BuilderFieldLabel>
      <ContainerForOptionalFieldValue
        value={state.lengthInBytesState.numericValue}
        defaultValueText={"default (32 bytes)"}
        setDefaultValue={() => state.lengthInBytesState.setValue(64)}
        setDefaultValueButtonLabel={"modify"}
      > 
        <NumberPlusMinusView
          id={field}
          className={css.LengthTextField}
          state={state.lengthInBytesState}
          placeholder={"64"}
          style={{
            borderColor: fieldBorderColor,
            ...FieldUnderlineStyle(Colors.LengthLimit),
          }}
          onFocusedOrChanged={fieldFocusState.focus} />
        <i>bytes</i>
      </ContainerForOptionalFieldValue>
    </BuilderFieldContainer>
  );
});

export const RawJsonFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  const field = "rawJson";
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  const textAreaComponentRef = React.useRef<HTMLTextAreaElement>(null);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>raw json:</BuilderFieldLabel>
        <div className={css.FormattedRecipeBox}>
          <div className={css.FormattedRecipeUnderlay} style={{
            width: `${valueElementWidthVw}vw`,
          }} >
            <EnhancedRecipeView recipeJson={state.recipeJson} />
          </div>
          <textarea
            spellCheck={false}
            ref={textAreaComponentRef}
            className={css.FormattedRecipeTextField}
            value={state.recipeJson ?? ""}
            onFocus={fieldFocusState.focus}
            onInput={ e => {state.setRecipeJson(e.currentTarget.value); fieldFocusState.focus(); }} 
            style={{
              width: `${valueElementWidthVw}vw`,
            }}
          />
        </div>
    </BuilderFieldContainer>
  );
});


export const RecipeEditableFieldsView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "flex-start"
    }}>
      <BuilderFieldContainer>
        <span style={{fontSize: `1.05rem`, fontStyle: "italic"}}>Recipe instructions applicable to {
          describeRecipeType(state.type, {pluralize: true})
          }:</span>
      </BuilderFieldContainer>
      { state.usePurposeOrAllow === "allow" ? (
        <SiteFieldView state={state} />
      ) : state.usePurposeOrAllow === "purpose" ? (
        <PurposeFieldView state={state} />
      ) : null }
      <LengthInCharsFormFieldView state={state} />
      <LengthInBytesFormFieldView state={state} />
      <SequenceNumberFormFieldView state={state} />
      { state.editingMode !== RecipeEditingMode.EditIncludingRawJson ? null : (
        <RawJsonFieldView state={state} />
      )}
    </div>
  );
});

// export const JsonFieldView = observer( ({state}: {
//   state: RecipeBuilderState,
// } ) => {
//   const textAreaComponentRef = React.useRef<HTMLTextAreaElement>(null);
//   const divAreaComponentRef = React.useRef<HTMLDivElement>(null);
//   const editable = state.editingMode === RecipeEditingMode.EditIncludingRawJson;
//   const { width } = useContainerDimensions(editable ? textAreaComponentRef : divAreaComponentRef)
//   const fieldFocusState = new RecipeFieldFocusState(state, "rawJson");
//   return (
//     <RecipeFieldView
//       focusState={fieldFocusState}
// //      toggleEdit={ state.toggleAllowEditingOfRawRecipe }
// //      mayEdit={ editable }
//       label="recipe in JSON format">
//       <div className={css.FormattedRecipeBox}>
//         <div className={css.FormattedRecipeUnderlay} style={{width: `${width ?? 0}px`}} >
//           <EnhancedRecipeView recipeJson={state.recipeJson} />
//         </div>
//         { editable ? (
//           <textarea
//             spellCheck={false}
//             ref={textAreaComponentRef}
//             disabled={!editable}
//             className={css.FormattedRecipeTextField}
//             value={state.recipeJson ?? ""}
//             style={{...(editable ? {} : {userSelect: "all"})}}
//             onFocus={fieldFocusState.focus}
//             onInput={ e => {state.setRecipeJson(e.currentTarget.value); fieldFocusState.focus(); }} 
//           />
//         ) : (
//           <div
//             ref={divAreaComponentRef}
//             className={css.FormattedRecipeDisabledDiv}
//             style={{userSelect: "all"}}
//           >{state.recipeJson ?? (<>&nbsp;</>)}</div>   
//         ) }
//       </div>
//     </RecipeFieldView>
//   );
// });

// export const RecipeRawJsonView = observer( ( {state}: {state: RecipeBuilderState}) => {
//   return (
//     <div className={css.RecipeSingleFieldRow}>
//       <JsonFieldView state={state} />
//     </div>
//   );
// });


export const RecipeFieldEditorView = observer( ( {state}: {state: RecipeBuilderState, hideHeader?: boolean}) => {
  return (
    <div 
      style={{
        display: `flex`,
        flexDirection: `column`,
        alignItems: `center`,
        ...visibility(state.type != null && state.editingMode !== RecipeEditingMode.NoEdit)}}
    >
      <RecipeEditableFieldsView state={state} />
    </div>
  );
});
