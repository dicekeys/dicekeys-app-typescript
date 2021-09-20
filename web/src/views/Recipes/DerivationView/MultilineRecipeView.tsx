import css from "../Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { parseAnnotatedJson, ParsedJsonArrayField, ParsedJsonObjectField } from "../../../utilities/jsonParser";

const RecipeJsonAllowEntryFieldView = ({field} : {field: ParsedJsonObjectField}) => {
  const {name, value} = field;
  return (<>
    {name.leadingWhiteSpace}
    <span className={[css.quote_span].join(" ")}>{`"`}</span>
    <span className={[css.string_field__span].join(" ")}>{
        name.value
    }</span>
    <span className={[css.quote_span].join(" ")}>{`"`}</span>
    {name.trailingWhiteSpace}
    <span className={[css.colon_span].join(" ")}>:</span>
    {value.leadingWhiteSpace}
    {
      (value.type === "string") ? (
        <>
          <span className={[css.quote_span].join(" ")}>{`"`}</span>
          <span className={[
              css.string_value_span,
              name.value === "host" ? css.host_name_span : ""
            ].join(" ")}>{
              value.value
          }</span>
          <span className={[css.quote_span].join(" ")}>{`"`}</span>
        </>
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
    <div className={[css.Depth1, css.allow].join(" ")}>
      { allowObject.leadingWhiteSpace}
      <span className={[css.brace_span].join(" ")}>{`{`}</span>
      { fields.map( field => (
        <RecipeJsonAllowEntryFieldView {...{key: field.name.value, field}} />
      ) ) }
      <span className={[css.brace_span].join(" ")}>{`}`}</span>
      { allowObject.trailingWhiteSpace }
      {
        // Add trailing comma if present
        field.indexOfTrailingComma == null ? null : (
          <span className={[css.comma_span].join(" ")}>,</span>
      ) }
    </div>
  );
}

const RecipeJsonFieldValueView = ({field} : {field: ParsedJsonObjectField}) => {
  const {asJsonString: valueAsJsonString} = field;
  switch (field.name.value) {
    case "allow": 
    if (field.value.type !== "array") return null;
    return (<>
      <span className={[css.bracket_span].join(" ")}>{`[`}</span>
      {field.value.fields.map( (field, index) => (
        <RecipeJsonAllowArrayFieldView {...{key: index.toString(), field}} />
      )) }
      <span className={[css.bracket_span].join(" ")}>{`]`}</span>
    </>);
      case "#": return (
      <span className={[css.number_value_span, css.sequence_number_span].join(" ")}>{valueAsJsonString}</span>
    );
    case "purpose": return field.value.type !== "string" ? null : (
      <>
        <span className={[css.quote_span].join(" ")}>{`"`}</span>
        <span className={[css.string_value_span, css.host_name_span].join(" ")}>{field.value.value}</span>
        <span className={[css.quote_span].join(" ")}>{`"`}</span>
      </>
    );
    case "lengthInChars": return (
      <span className={[css.number_value_span, css.length_span].join(" ")}>{valueAsJsonString}</span>
    );
    default: return (field.value.type === "string") ? (
        <>
          <span className={[css.quote_span].join(" ")}>{`"`}</span>
          <span key={field.name.value} className={"MultiLineRecipe"}>{ valueAsJsonString }</span>
          <span className={[css.quote_span].join(" ")}>{`"`}</span>
        </>
      ) : (
        <span key={field.name.value} className={"MultiLineRecipe"}>{ valueAsJsonString }</span>
      );
  }
}

const RecipeJsonFieldView = ({field} : {field: ParsedJsonObjectField}): JSX.Element => {
  return (
    <div className={[css.Depth1].join(" ")}>
      { field.name.leadingWhiteSpace}
      <span className={[css.quote_span].join(" ")}>"</span>
      <span className={[css.string_field_name_span].join(" ")}>{field.name.value}</span>
      <span className={[css.quote_span].join(" ")}>"</span>
      { field.name.trailingWhiteSpace }
      <span className={[css.colon_span].join(" ")}>:</span>
      { field.value.leadingWhiteSpace }
      <RecipeJsonFieldValueView {...{field}}/>
      { field.value.trailingWhiteSpace }
      { field.indexOfTrailingComma == null ? null : (
          <span className={[css.comma_span].join(" ")}>,</span>
      )}
    </div>
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
        <div className={[css.MultiLineRecipe, css.Depth0].join(" ")}
          onCopy={e => {
            // When we display the recipe on multiple lines and with indentation,
            // the browser may want include new line symbols (\n) to and white space
            // to represent the that formatting, and so the copied raw JSON string
            // may be different than the actual raw JSON string.
            // To prevent this, we override the copy operation to ensure that copies
            // always yield the raw, unmodified, plaintext of the raw JSON string without
            // any added newlines or white space.
            e.clipboardData.setData('text/plain', recipeJson ?? "");
            e.preventDefault();
          }
        }
        >
          {/* Display the opening brace ("{") and any white space before it */}
          {recipeObject.leadingWhiteSpace}
          <span className={[css.brace_span].join(" ")}>{`{`}</span>
          {recipeObject.fields.map( (field) =>
            (<RecipeJsonFieldView {...{key: field.name.value,recipeJson, field}} />)
          )}
          <span className={[css.brace_span].join(" ")}>{`}`}</span>
          {recipeObject.trailingWhiteSpace}
        </div>
      );
    }
  } catch (e) {}
  return (
    <div className={[css.MultiLineRecipe, css.Depth0].join(" ")}>
      { recipeJson || ( <>&nbsp;</>) }
    </div>
  );
});