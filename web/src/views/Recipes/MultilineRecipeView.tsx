import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
//import { DiceKeysAppSecretRecipe } from "../../dicekeys";
// import { JsxReplacer } from "../../utilities/JsxReplacer";
import { parseAnnotatedJson, ParsedJsonArrayField, ParsedJsonObjectField } from "../../utilities/jsonParser";

const RecipeJsonAllowEntryFieldView = ({field} : {field: ParsedJsonObjectField}) => {
  const {name, value} = field;
  return (<>
    {name.leadingWhiteSpace}
    <span className={[css.FormattedRecipeSpan, css.quote].join(" ")}>{`"`}</span>
    {name.value}
    <span className={[css.FormattedRecipeSpan, css.quote].join(" ")}>{`"`}</span>
    {name.trailingWhiteSpace}
    {":"}
    {value.leadingWhiteSpace}
    {
      (value.type === "string") ? (
        <>
          <span className={[css.FormattedRecipeSpan, css.quote].join(" ")}>{`"`}</span>
          <span className={[
              css.FormattedRecipeSpan,
              name.value === "host" ? css.host_name_span : css.fixme
            ].join(" ")}>{
              value.value
          }</span>
          <span className={[css.FormattedRecipeSpan, css.quote].join(" ")}>{`"`}</span>
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
  return (<div className={[css.FormattedRecipeSpan, css.allow].join(" ")}>
    { allowObject.leadingWhiteSpace}
    <span className={[css.FormattedRecipeSpan, css.brace].join(" ")}>{`{`}</span>
    { fields.map( field => (
      <RecipeJsonAllowEntryFieldView {...{key: field.name.value, field}} />
    ) ) }
    <span className={[css.FormattedRecipeSpan, css.brace].join(" ")}>{`}`}</span>
    { allowObject.trailingWhiteSpace }
    {
      // Add trailing comma if present
      field.indexOfTrailingComma == null ? null : (
        <span className={[css.FormattedRecipeSpan, css.comma_span].join(" ")}>,</span>
    ) }
  </div>)
}

const RecipeJsonFieldValueView = ({field} : {field: ParsedJsonObjectField}) => {
  const {asJsonString: valueAsJsonString} = field;
  switch (field.name.value) {
    case "allow": 
    if (field.value.type !== "array") return null;
    return (<>
      <div className={[css.FormattedRecipeSpan, css.allow].join(" ")}>{`[`}</div>
      {field.value.fields.map( (field, index) => (
        <RecipeJsonAllowArrayFieldView {...{key: index.toString(), field}} />
      )) }
      <div className={[css.FormattedRecipeSpan, css.allow].join(" ")}>{`]`}</div>
    </>);
      case "#": return (
      <span className={[css.FormattedRecipeSpan, css.sequence_number_span].join(" ")}>{valueAsJsonString}</span>
    );
    case "purpose": return (
      <span className={[css.FormattedRecipeSpan, css.host_name_span].join(" ")}>{valueAsJsonString}</span>
    );
    case "lengthInChars": return (
      <span className={[css.FormattedRecipeSpan, css.length_span].join(" ")}>{valueAsJsonString}</span>
    );
    default: return (
      <span key={field.name.value} className={"MultilineRecipeDepth1"}>{ valueAsJsonString }</span>
    );
  }
}

const RecipeJsonFieldView = ({field} : {field: ParsedJsonObjectField}): JSX.Element => {
  return (
    <>
      { field.name.leadingWhiteSpace}
      <span className={"MultilineRecipeFieldQuote"}>"</span>
      <span className={"MultilineRecipeFieldNameText"}>{field.name.value}</span>
      <span className={"MultilineRecipeFieldQuote"}>"</span>
      { field.name.trailingWhiteSpace }
      <span className={"MultilineRecipeFieldNameColon"}>:</span>
      <RecipeJsonFieldValueView {...{field}}/>
    </>
  );
}

export const MultilineRecipeJsonView = ({recipeJson}: {recipeJson: string}): JSX.Element => {
  try {
    const recipeObject = parseAnnotatedJson(recipeJson);
    if (recipeObject.type != "object") {
      throw "invalid recipe";
    }
    return (
      <>
        <div className={"MultilineRecipeDepth0"}>{
          // Display the opening brace ("{") and any white space before it
          recipeJson.substr(0, recipeObject.indexOfOpeningBrace + 1)
        }</div>
        {recipeObject.fields.map( (field) =>
          (<RecipeJsonFieldView {...{key: field.name.value,recipeJson, field}} />)
        )}
        <div className={"MultilineRecipeDepth0"}>{
          // Display the closing brace ("}") and any white space after it
          recipeJson.substr(recipeObject.indexOfClosingBrace)
        }</div>
      </>
    );
  } catch (e) {
    return (<>{ recipeJson }</>)
  }
}

export const MultilineRecipeView = observer( ( {state}: {state: RecipeBuilderState}) => (
  <div className={css.RawRecipeView}>
    {/* <div className={css.RawRecipeLabel}>Recipe:</div> */}
    <div className={css.RawRecipeValue} >
      <MultilineRecipeJsonView recipeJson={ state.recipeJson ?? "{}"  }/>
    </div>
  </div>
));