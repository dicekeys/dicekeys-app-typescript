import css from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DiceKeysAppSecretRecipe } from "~dicekeys";

export const EnhancedRecipeView = ({recipeJson}: {recipeJson?: string}) => {
  const recipe = JSON.parse(recipeJson || "{}") as DiceKeysAppSecretRecipe;
  var ingredients: (JSX.Element | string)[] = [recipeJson ?? ""];
  const replace = (stringToReplace: string, replacementElement: JSX.Element) => {
    ingredients = ingredients.reduce( (result, item ) => {
      if (typeof item !== "string" || item.indexOf(stringToReplace) < 0) {
        result.push(item);
      } else {
        const indexOfString = item.indexOf(stringToReplace);
        const prefix = item.substr(0, indexOfString);
        const suffix = item.substr(indexOfString + stringToReplace.length);
        result.push(prefix, replacementElement, suffix);
      }
      return result;
    }, [] as (JSX.Element | string)[])
  }
  const sequenceNumber = recipe["#"];
  if (sequenceNumber != null && sequenceNumber >= 2) {
    replace(`"#":${sequenceNumber}`, (<>"#":<span className={css.sequence_number_span}>{sequenceNumber}</span></>));
  }
  const lengthInChars = recipe.lengthInChars;
  if (lengthInChars != null) {
    replace(`"lengthInChars":${lengthInChars}`, (<>"lengthInChars":<span className={css.length_span}>{lengthInChars}</span></>));
  }
  const purpose = recipe.purpose;
  if (purpose != null) {
    const jsonEncodedPurpose = JSON.stringify(purpose)
    const jsonEscapedPurpose = jsonEncodedPurpose.substr(1, jsonEncodedPurpose.length - 2);
    replace(`"purpose":${JSON.stringify(purpose)}`, (<>"purpose":"<span className={css.host_name_span}>{jsonEscapedPurpose}</span>"</>));
  }
  const allow = recipe.allow;
  if (allow != null) {
    allow.forEach( ({host}) => {
      replace(`"host":"${host}"`, (<>"host":<span className={css.host_name_span}>{host}</span></>));
    });
  }
  return (
    <>
      {ingredients.map( (item, index) => (
        <span key={`${index}`}>{item}</span>
      ))}
    </>
  );
}

export const LabeledEnhancedRecipeView = observer( ( props: {state: RecipeBuilderState}) => (
  <div className={css.RawRecipeView}>
    { props.state.recipeJson == null ? (<></>) : (
      <>
      <div className={css.RawRecipeLabel}>Recipe:</div>
      <div className={css.RawRecipeValue}>
        <EnhancedRecipeView recipeJson={ props.state.recipeJson  }/>
      </div>
      </>
    )}
  </div>
));