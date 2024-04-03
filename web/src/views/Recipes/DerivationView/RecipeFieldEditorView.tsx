import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, RecipeEditingMode } from "../RecipeBuilderState";
import { NumberPlusMinusView, NumericTextFieldState } from "../../basics/NumericTextFieldView";
import { describeRecipeType } from "../DescribeRecipeType";
import { EnhancedRecipeView } from "../EnhancedRecipeView";
import { BuilderLabelValueMargin,
  BuilderLabelWidth,
  HostNameInputField,
  FormattedRecipeTextAreaJson,
  FormattedRecipeUnderlayJson,
  FormattedRecipeBox,
  SequenceNumberInputField,
  LengthInputField,
} from "./RecipeStyles";
import styled from "styled-components";
import { DerivationViewSection } from "./DerivationViewLayout";

const BuilderFieldContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    margin-top: 0.25vh;
`;

const BuilderFieldLabel = styled.label`
  width: ${BuilderLabelWidth};
  text-align: right;
  padding-right: ${BuilderLabelValueMargin};
  margin-right: ${BuilderLabelValueMargin};
  border-right: 1px rgba(128,128,128, 0.5) solid;
`;

const OptionalFieldLabel = styled.span`
  color: ${ props => props.theme.colors.foregroundDeemphasized }
`
const OptionalFieldActivationButton = styled.button`
  margin-left: 1rem;
`;

/* const ContainerForOptionalFieldValue = observer ( ({
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
        >{
          optProps.setDefaultValueButtonLabel
        }</OptionalFieldActivationButton>
      </>
    ) : children
  }
  </>
)); */


const ContainerForOptionalNumericFieldValue = observer ( ({
  numericTextFieldState, children, ...optProps
}: React.PropsWithChildren<(
  {
    numericTextFieldState: NumericTextFieldState
    defaultValueText: string,
    setDefaultValueButtonLabel: string,
//    setDefaultValue: () => void,
})>) => (
  <>{
    (numericTextFieldState.editingModeOn === false) ? (
      <>
        <OptionalFieldLabel>{optProps.defaultValueText}</OptionalFieldLabel>
        <OptionalFieldActivationButton
          onClick={numericTextFieldState.setToDefaultValue}
        >{
          optProps.setDefaultValueButtonLabel
        }</OptionalFieldActivationButton>
      </>
    ) : (
      <>
        {children}
        <OptionalFieldActivationButton
          onClick={numericTextFieldState.clear}
        >Remove</OptionalFieldActivationButton>
      </>)
  }
  </>
));


export const SiteFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  if (state.siteTextField == null) return null;
  const field = "sites"
  const fieldFocusState = state.focusState.focusStateForField(field);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>sites</BuilderFieldLabel>
      <HostNameInputField id={field}
        value={state.siteTextField ?? ""}
//        placeholder=""
        ref={ e => { if (e != null) { fieldFocusState.focus() } } }
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
  const fieldFocusState = state.focusState.focusStateForField(field);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>Purpose</BuilderFieldLabel>
      <HostNameInputField id={field}
        size={40}
        value={state.purposeField ?? ""}
//        placeholder=""
        ref={ e => { if (e != null) { fieldFocusState.focus() } } }
        onInput={ e => {state.setPurposeField(e.currentTarget.value); fieldFocusState.focus(); }} 
        onFocus={ fieldFocusState.focus } />
    </BuilderFieldContainer>
  );
});

export const SequenceNumberFormFieldValueView = observer( ({state}: {state: RecipeBuilderState}) => {
  const field = "#"
  const fieldFocusState = state.focusState.focusStateForField(field);
  return (
      <NumberPlusMinusView
        key={field}
        state={state.sequenceNumberState}
      >
        <SequenceNumberInputField
          value={state.sequenceNumberState.textValue}
          onFocus={fieldFocusState.focus}
          onChange={state.sequenceNumberState.onChangeInTextField}
        />
      </NumberPlusMinusView>
 )});

export const SequenceNumberFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={"#"}>sequence #</BuilderFieldLabel>
      <ContainerForOptionalNumericFieldValue
        numericTextFieldState={state.sequenceNumberState}
        defaultValueText={"none"}
        setDefaultValueButtonLabel={"add"}
      >
        <SequenceNumberFormFieldValueView state={state} />
      </ContainerForOptionalNumericFieldValue>
    </BuilderFieldContainer>    
));

  export const LengthInCharsFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
    if (state.type !== "Password" || state.lengthInCharsFieldHide || !state.mayEditLengthInChars) return null;
    const field = "lengthInChars";
    const fieldFocusState = state.focusState.focusStateForField(field);
    return (
      <BuilderFieldContainer >
        <BuilderFieldLabel htmlFor={field}>max length</BuilderFieldLabel>
        <ContainerForOptionalNumericFieldValue
          numericTextFieldState={state.lengthInCharsState}
          defaultValueText={"no limit"}
          setDefaultValueButtonLabel={"add"}
        >
        <NumberPlusMinusView
          key={field}
          state={state.lengthInCharsState}
        >
          <LengthInputField
            value={state.lengthInCharsState.textValue}
            placeholder={"none"}
            onFocus={fieldFocusState.focus}
            onChange={state.lengthInCharsState.onChangeInTextField}
          />
        </NumberPlusMinusView>  
        <i>characters</i>
        </ContainerForOptionalNumericFieldValue>
      </BuilderFieldContainer>
    );
  });

export const LengthInBytesFormFieldView = observer( ({state}: {state: RecipeBuilderState}) => {
  if (state.type !== "Secret" || state.lengthInBytesFieldHide || !state.mayEditLengthInBytes) return null;
  const field = "lengthInBytes";
  const fieldFocusState = state.focusState.focusStateForField(field);
  return (
    <BuilderFieldContainer >
      <BuilderFieldLabel htmlFor={field}>length</BuilderFieldLabel>
      <ContainerForOptionalNumericFieldValue
        numericTextFieldState={state.lengthInBytesState}
        defaultValueText={"default (32 bytes)"}
        setDefaultValueButtonLabel={"modify"}
      >
        <NumberPlusMinusView
          key={field}
          state={state.lengthInBytesState}
        >
          <LengthInputField
            value={state.lengthInBytesState.textValue}
            placeholder={"32"}
            onFocus={fieldFocusState.focus}
            onChange={state.lengthInBytesState.onChangeInTextField}
          />
        </NumberPlusMinusView>  
        <i>bytes</i>
      </ContainerForOptionalNumericFieldValue>
    </BuilderFieldContainer>
  );
});

export const RawJsonFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  const field = "rawJson";
  const fieldFocusState = state.focusState.focusStateForField(field);
  const textAreaComponentRef = React.useRef<HTMLTextAreaElement>(null);
  return (
    <BuilderFieldContainer>
      <BuilderFieldLabel htmlFor={field}>raw json</BuilderFieldLabel>
      <FormattedRecipeBox>
        <FormattedRecipeUnderlayJson>
          <EnhancedRecipeView recipeJson={state.rawRecipeJson} />
        </FormattedRecipeUnderlayJson>
        <FormattedRecipeTextAreaJson
          ref={textAreaComponentRef}
          value={state.rawRecipeJson ?? ""}
          onFocus={fieldFocusState.focus}
          onInput={ e => {state.setAllFromRecipeJson(e.currentTarget.value); fieldFocusState.focus(); }} 
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

const HeaderInstruction = styled.div`
  font-size: 1.1rem;
`

const FooterGentleWarning = styled.div`
  font-size: 0.9rem;
  font-style: italic;
`

export const RecipeFieldEditorView = observer( ( {state}: {state: RecipeBuilderState}) => {
  return (
    <RecipeFieldEditorContainer
      $invisible={state.type == null || state.editingMode === RecipeEditingMode.NoEdit}
    >
      <HeaderInstruction>
        Recipe instructions applicable to {
          describeRecipeType(state.type, {pluralize: true})
        }:
      </HeaderInstruction>
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
      <FooterGentleWarning>
        Even the smallest change to any field changes the entire {state.typeNameLc}.
      </FooterGentleWarning>
    </RecipeFieldEditorContainer>
  );
});
