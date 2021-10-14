import React from "react";
import { observer  } from "mobx-react";
import { RecipeFieldFocusState, RecipeBuilderState, RecipeEditingMode } from "../RecipeBuilderState";
import { NumberPlusMinusView } from "../../basics/NumericTextFieldView";
import { describeRecipeType } from "../DescribeRecipeType";
import { EnhancedRecipeView } from "../EnhancedRecipeView";
import { BuilderLabelValueMarginVw,
  BuilderLabelWidthVw,
  HostNameInputField,
  FormattedRecipeTextAreaJson,
  FormattedRecipeUnderlayJson,
  FormattedRecipeBox,
  SequenceNumberInputField,
  LengthInputField,
} from "./RecipeStyles";
import styled from "styled-components";
import { DerivationViewSection } from "./DerivationViewLayout";

const BuilderFieldLabel = styled.label`
  width: ${BuilderLabelWidthVw}vw;
  text-align: right;
  padding-right: ${BuilderLabelValueMarginVw}vw;
  margin-right: ${BuilderLabelValueMarginVw}vw;
  border-right: 1px rgba(128,128,128, 0.5) solid;
`;

const OptionalFieldLabel = styled.span`
  color: rgba(128,128,128,1);
`
const OptionalFieldActivationButton = styled.button`
  margin-left: 1rem;
`;

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
        <OptionalFieldLabel>{optProps.defaultValueText}</OptionalFieldLabel>
        <OptionalFieldActivationButton
          onClick={optProps.setDefaultValue}
          style={{marginLeft: `1rem`}}
        >{
          optProps.setDefaultValueButtonLabel
        }</OptionalFieldActivationButton>
      </>
    ) : children
  }
  </>
));

const BuilderFieldContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: baseline;
    margin-top: 0.25vh;
`;

export const SiteFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  if (state.siteTextField == null) return null;
  const field = "sites"
  const fieldFocusState = new RecipeFieldFocusState(state, field);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>sites</BuilderFieldLabel>
      <HostNameInputField id={field}
        value={state.siteTextField ?? ""}
        placeholder=""
        ref={ e => { if (e != null) { e?.focus(); fieldFocusState.focus() } } }
        onPaste={ state.pasteIntoSiteTextField }
        onInput={ e => {state.setSiteTextField(e.currentTarget.value); fieldFocusState.focus(); }} 
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
      <HostNameInputField id={field}
        size={40}
        value={state.purposeField ?? ""}
        placeholder=""
        ref={ e => { if (e != null) { e?.focus(); fieldFocusState.focus() } } }
        onPaste={ state.pasteIntoSiteTextField }
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
          state={state.sequenceNumberState}
        >
          <SequenceNumberInputField
            value={state.sequenceNumberState.textValue}
            onFocus={fieldFocusState.focus}
            onChange={fieldFocusState.focus}
          />
        </NumberPlusMinusView>
      </ContainerForOptionalFieldValue>
    </BuilderFieldContainer>    
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
          state={state.lengthInCharsState}
        >
          <LengthInputField
            value={state.lengthInCharsState.textValue}
            placeholder={"none"}
            onFocus={fieldFocusState.focus}
            onChange={fieldFocusState.focus}
          />
        </NumberPlusMinusView>  
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
          state={state.lengthInBytesState}
        >
          <LengthInputField
            value={state.lengthInBytesState.textValue}
            placeholder={"32"}
            onFocus={fieldFocusState.focus}
            onChange={fieldFocusState.focus}
          />
        </NumberPlusMinusView>  
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
      <FormattedRecipeBox>
        <FormattedRecipeUnderlayJson>
          <EnhancedRecipeView recipeJson={state.recipeJson} />
        </FormattedRecipeUnderlayJson>
        <FormattedRecipeTextAreaJson
          ref={textAreaComponentRef}
          value={state.recipeJson ?? ""}
          onFocus={fieldFocusState.focus}
          onInput={ e => {state.setRecipeJson(e.currentTarget.value); fieldFocusState.focus(); }} 
        />
      </FormattedRecipeBox>
    </BuilderFieldContainer>
  );
});

const RecipeFieldEditorContainer = styled(DerivationViewSection)<{$invisible?: boolean}>`
  justify-content: flex-end;
  align-items: flex-start;
  visibility: ${props => props.$invisible ? "hidden" : "visible"};
`

export const RecipeFieldEditorView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <RecipeFieldEditorContainer
      $invisible={state.type == null || state.editingMode === RecipeEditingMode.NoEdit}
    >
      <div style={{fontSize: `1.1rem`}}>Recipe instructions applicable to {
        describeRecipeType(state.type, {pluralize: true})
        }:</div>
      { state.wizardPrimaryFieldOverride == null ? (
        <SiteFieldView state={state} />
      ) : state.wizardPrimaryFieldOverride === "purpose" ? (
        <PurposeFieldView state={state} />
      ) : null }
      <LengthInCharsFormFieldView state={state} />
      <LengthInBytesFormFieldView state={state} />
      <SequenceNumberFormFieldView state={state} />
      { state.editingMode !== RecipeEditingMode.EditIncludingRawJson ? null : (
        <RawJsonFieldView state={state} />
      )}
      <div style={{fontSize: `0.9rem`, fontStyle: "italic"}}>
        Even the smallest change to any field changes the entire {state.typeNameLc}.
      </div>
    </RecipeFieldEditorContainer>
  );
});
