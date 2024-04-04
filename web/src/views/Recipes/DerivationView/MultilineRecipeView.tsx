import React from "react";
import { observer  } from "mobx-react";
import { parseAnnotatedJson, ParsedJsonArrayField, ParsedJsonObjectField } from "../../../utilities/jsonParser";
import {
  HostNameSpan,
  InBraces,
  InBrackets,
  IndentJson,
  InDoubleQuotes,
  JsonNameValueSeparationColon,
  LengthFieldValueSpan,
  MultiLineRecipeDiv,
  PurposeSpan,
  QuotedFieldNameSpan,
  RecipeCommaSeparator,
  RecipeStringValueSpan,
  RecipeValueTypeUnknownSpan,
  SequenceNumberValueSpan
} from "./RecipeStyles";

const RecipeJsonAllowEntryFieldView = ({field} : {field: ParsedJsonObjectField}) => {
  const {name, value} = field;
  return (<>
    {name.leadingWhiteSpace}
    <QuotedFieldNameSpan>{name.value}</QuotedFieldNameSpan>
    {name.trailingWhiteSpace}
    <JsonNameValueSeparationColon/>
    {value.leadingWhiteSpace}
    {
      (value.type === "string") ? (
        <InDoubleQuotes>
          { name.value === "host" ?
            (<HostNameSpan>{value.value}</HostNameSpan>) :
            (<RecipeStringValueSpan>{value.value}</RecipeStringValueSpan>)
          }
        </InDoubleQuotes>
      ) : field.asJsonString
    }
    {value.trailingWhiteSpace}
  </>)
}

const RecipeJsonAllowArrayFieldView = ({field} : {field: ParsedJsonArrayField}) => {
  const allowObject = field.value;
  if (allowObject.type !== "object") return null;
  const {fields} = allowObject;
  return (
    <IndentJson>
      { allowObject.leadingWhiteSpace}
      <InBrackets>{
        fields.map( field => (
          <RecipeJsonAllowEntryFieldView {...{key: field.name.value, field}} />
        ))
      }</InBrackets>
      { allowObject.trailingWhiteSpace }
      {
        // Add trailing comma if present
        field.indexOfTrailingComma == null ? null : (
          <RecipeCommaSeparator/>
      ) }
    </IndentJson>
  );
}

const RecipeJsonFieldValueView = ({field} : {field: ParsedJsonObjectField}) => {
  const {asJsonString: valueAsJsonString} = field;
  switch (field.name.value) {
    case "allow": 
      if (field.value.type !== "array") return null;
      return (
        <InBrackets>{
          field.value.fields.map( (field, index) => (
            <RecipeJsonAllowArrayFieldView {...{key: index.toString(), field}} />
          ))
        }</InBrackets>
      );
      case "#": return (
        <SequenceNumberValueSpan>{valueAsJsonString}</SequenceNumberValueSpan>
    );
    case "purpose": return field.value.type !== "string" ? null : (
      <InDoubleQuotes>
        <RecipeStringValueSpan><PurposeSpan>{field.value.value}</PurposeSpan></RecipeStringValueSpan>
      </InDoubleQuotes>
    );
    case "lengthInChars": return (
      <LengthFieldValueSpan>{valueAsJsonString}</LengthFieldValueSpan>
    );
    default: return (field.value.type === "string") ? (
        <InDoubleQuotes>
          <RecipeStringValueSpan>{ valueAsJsonString }</RecipeStringValueSpan>
        </InDoubleQuotes>
      ) : (
        <RecipeValueTypeUnknownSpan>{ valueAsJsonString }</RecipeValueTypeUnknownSpan>
      );
  }
}

const RecipeJsonFieldView = ({field} : {field: ParsedJsonObjectField}): JSX.Element => {
  return (
    <IndentJson>
      { field.name.leadingWhiteSpace}
      <QuotedFieldNameSpan>{field.name.value}</QuotedFieldNameSpan>
      { field.name.trailingWhiteSpace }
      <JsonNameValueSeparationColon/>
      { field.value.leadingWhiteSpace }
      <RecipeJsonFieldValueView {...{field}}/>
      { field.value.trailingWhiteSpace }
      { field.indexOfTrailingComma == null ? null : (
          <RecipeCommaSeparator/>
      )}
    </IndentJson>
  );
}

/**
 * A view that pretty prints a recipe JSON string onto multiple lines with indentation and
 * coloring for readability
 * @param recipeJson The plaintext string containing a JSON recipe to display
 * @returns 
 */
export const MultilineRecipeJsonView = observer( ({recipeJson}: {recipeJson?: string}): JSX.Element => {
  try {
    const recipeObject = recipeJson == null ? undefined : parseAnnotatedJson(recipeJson);
    if (recipeObject != null && recipeObject.type === "object") {
      return (
        <MultiLineRecipeDiv
          // onCopy={(e) => { e.preventDefault() }}
          
          onCopy={ (e) => {
            // When we display the recipe on multiple lines and with indentation,
            // the browser may want include new line symbols (\n) to and white space
            // to represent the that formatting, and so the copied raw JSON string
            // may be different than the actual raw JSON string.
            // To prevent this, we override the copy operation to ensure that copies
            // always yield the raw, unmodified, plaintext of the raw JSON string without
            // any added newlines or white space.
            e.preventDefault()
            e.clipboardData.setData('text/plain', recipeJson ?? "");
          } }
        >
          {/* Display the opening brace ("{") and any white space before it */}
          {recipeObject.leadingWhiteSpace}
          <InBraces>{
            recipeObject.fields.map( (field) =>
              (<RecipeJsonFieldView {...{key: field.name.value,recipeJson, field}} />)
            )
          }</InBraces>
          {recipeObject.trailingWhiteSpace}
        </MultiLineRecipeDiv>
      );
    }
  } catch (e) {}
  return (
    <MultiLineRecipeDiv>
      { recipeJson || ( <>&nbsp;</>) }
    </MultiLineRecipeDiv>
  );
});
