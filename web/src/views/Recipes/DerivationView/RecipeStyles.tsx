import React from "react";
import styled, {css} from "styled-components";
import * as Dimensions from "./DerivationViewLayout";

export const FieldEditorWidth = Math.min(80, Dimensions.ContentWidthInVw)
export const BuilderLabelWidthVw = 10;
export const BuilderLabelValueMarginVw = 0.5;
export const ValueElementWidthVw = FieldEditorWidth - (BuilderLabelWidthVw + BuilderLabelValueMarginVw);

const EdgelessSpan = styled.span`
  border-width: 0;
  margin: 0;
  padding: 0;
`;

const FieldTextFontCss = css`
  font-size: 1.1rem;
`;

const TextInputWithoutSpellCheck = styled.input.attrs(() => ({
  type: "text",
  spellCheck: false,
}))`
  width: ${ValueElementWidthVw}vw;
`;

export const RecipeTextInputField = styled(TextInputWithoutSpellCheck)`
  ${FieldTextFontCss}
  background-color: rgba(128, 0, 128, 0.1);
  margin-left: 1rem;
  border-color: rgba(128, 128, 128, 0.2);
`

export const FormattedRecipeSpan = styled(EdgelessSpan)``;

export const RecipeFieldUnderline = css`
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-decoration-style: solid;
`;

export const HostNameUnderline = css`
  ${RecipeFieldUnderline}
  text-decoration-color: rgba(128, 0, 128, 0.5);
`;
export const PurposeUnderline = HostNameUnderline;

export const LengthFieldUnderline = css`
  ${RecipeFieldUnderline}
  text-decoration-color: rgba(0, 64, 196, 0.5);
`

export const SequenceNumberValueUnderline = css`
  ${RecipeFieldUnderline}
  text-decoration-color: rgba(16, 148, 16, 0.5);
`;

export const InputNumericText = styled.input.attrs((props) => ({
  type: "text",
  placeholder: props.placeholder ?? "none",
  size: props.size ?? 4
}))`
  ${(props) => (typeof parseInt(`${props.value ?? "1"}`.trim())) !== "number" ?
    `color: red` :
    ``}
`;

export const HostNameSpan = styled(EdgelessSpan)`${HostNameUnderline}`;
export const PurposeSpan = styled(EdgelessSpan)`${PurposeUnderline}`;
export const LengthFieldValueSpan = styled(EdgelessSpan)`${LengthFieldUnderline}`;
export const SequenceNumberValueSpan = styled(EdgelessSpan)`${SequenceNumberValueUnderline}`;
export const SequenceNumberInputField = styled(InputNumericText).attrs(()=>({
  size: 3,
  placeholder: "1",
}))`
  ${SequenceNumberValueUnderline}
`;

export const LengthInputField = styled(InputNumericText).attrs(()=>({
  size: 4
}))`
  ${LengthFieldUnderline}
`;

export const RecipeValueTypeUnknownSpan = styled.span`
  color: rgba(0, 0, 0, 1);
`;

export const RecipeStringValueSpan = styled.span`
  color: rgba(0, 0, 0, 1);
`;

export const DefaultJsonTextSpan = styled.span`
    color:rgba(0, 48, 128, 0.5);
`;

export const HostNameInputField = styled(RecipeTextInputField)`
  ${HostNameUnderline}
  min-width: 18rem;
`;
export const PurposeInputField = styled(RecipeTextInputField)`
  ${PurposeUnderline}
  min-width: 18rem;
`;

export const RecipeQuoteCharacterSpan = styled(DefaultJsonTextSpan)``;

export const InDoubleQuotes = (props: React.PropsWithChildren<{}>) => (
  <>
    <RecipeQuoteCharacterSpan>"</RecipeQuoteCharacterSpan>
    {props.children}
    <RecipeQuoteCharacterSpan>"</RecipeQuoteCharacterSpan>
  </>    
);

const RecipeQuoteBraceSpan = styled(DefaultJsonTextSpan)``;
const RecipeQuoteBracketSpan = styled(DefaultJsonTextSpan)``;

export const InBrackets = (props: React.PropsWithChildren<{}>) => (
  <>
    <RecipeQuoteBracketSpan>[</RecipeQuoteBracketSpan>
    {props.children}
    <RecipeQuoteBracketSpan>]</RecipeQuoteBracketSpan>
  </>    
);

export const InBraces = (props: React.PropsWithChildren<{}>) => (
  <>
    <RecipeQuoteBraceSpan>{"{"}</RecipeQuoteBraceSpan>
    {props.children}
    <RecipeQuoteBraceSpan>{"}"}</RecipeQuoteBraceSpan>
  </>    
);

const RecipeCommaSpan = styled(DefaultJsonTextSpan)``;

export const RecipeCommaSeparator = () => (
  <RecipeCommaSpan>,</RecipeCommaSpan>
);



const FieldNameSpan = styled(DefaultJsonTextSpan)`
  color: rgba(0, 0, 0, 0.5);
`;

export const QuotedFieldNameSpan = (props: React.PropsWithChildren<{}>) => (
  <InDoubleQuotes><FieldNameSpan>{props.children}</FieldNameSpan></InDoubleQuotes>
)

const ColonSpan = styled(DefaultJsonTextSpan)``;

export const JsonNameValueSeparationColon = (): JSX.Element => (
  <ColonSpan>:</ColonSpan>
);

export const IndentJson = styled.div`
  margin-left: 1rem;
`;

export const MultiLineRecipeDiv = styled.div`
  border-width: 0;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.5);
`;

export const FormattedRecipeBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding-left: 1rem;
  padding-right: 1rem;
  width: 100%
`;

const rawJsonFieldWidth = '60vw'; // FIXME

const FormattedRecipeStyle = css`
  width: calc(85vw-3rem);
  flex-grow: 1;
  overflow-wrap: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
  letter-spacing: normal;
  word-spacing: normal;
  text-transform: none;
  text-align: start;
  font: 400 0.75rem monospace; 
  border-width: 2px;
  padding: 1px 2px;
  border-style: inset;
  border-image: initial;
  border-radius: 2px;
  margin: 0;
  text-indent: 0;
`

const FormattedRecipeUnderlay = styled.div`
  ${FormattedRecipeStyle}
  position: absolute;
  z-index: -1;
  border-color: rgba(0,0,0,0);
  color: rgba(0,0,0,0);
`;

const FormattedRecipeTextArea = styled.textarea.attrs(() => ({
  spellCheck: false,
  rows: 2,
}))`
  ${FormattedRecipeStyle}
  display: flex;
  position: relative;
  align-self: stretch;
  flex-direction: column;
  justify-content: flex-end;
  align-content: flex-start;
  z-index: 2;
  background-color: rgba(0, 0, 0, 0);
`;

export const FormattedRecipeUnderlayJson = styled(FormattedRecipeUnderlay)`
  width: ${rawJsonFieldWidth}
`;

export const FormattedRecipeTextAreaJson = styled(FormattedRecipeTextArea)`
  width: ${rawJsonFieldWidth}
`;

export const FormattedJsonContainer = styled.div`
  display: inline-block;
`;