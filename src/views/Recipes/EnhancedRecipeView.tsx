import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DiceKeysAppSecretRecipe } from "../../dicekeys";

export const EnhancedRecipeView = ({recipeJson}: {recipeJson?: string}) => {
  try {
    const recipe = (recipeJson == null ? {} : JSON.parse(recipeJson)) as DiceKeysAppSecretRecipe;
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
      replace(`"lengthInChars":${lengthInChars}`, (<>"lengthInChars":<span className={[css.FormattedRecipeSpan, css.length_span].join(" ")}>{lengthInChars}</span></>));
    }
    const purpose = recipe.purpose;
    if (purpose != null) {
      const jsonEncodedPurpose = JSON.stringify(purpose)
      const jsonEscapedPurpose = jsonEncodedPurpose.substr(1, jsonEncodedPurpose.length - 2);
      replace(`"purpose":${jsonEncodedPurpose}`, (<>"purpose":"<span className={[css.FormattedRecipeSpan, css.host_name_span].join(" ")}>{jsonEscapedPurpose}</span>"</>));
    }
    const allow = recipe.allow;
    if (allow != null) {
      allow.forEach( ({host}) => {
        replace(`"host":"${host}"`, (<>"host":"<span className={[css.FormattedRecipeSpan, css.host_name_span].join(" ")}>{host}</span>"</>));
      });
    }
    return (
      <>
        {ingredients.map( (item, index) => (
          <span className={css.FormattedRecipeSpan} key={`${index}`}>{item}</span>
        ))}
      </>
    );
  } catch {
    return (<>{ recipeJson }</>)
  }
}

export const LabeledEnhancedRecipeView = observer( ( {state}: {state: RecipeBuilderState}) => (
  <div className={css.RawRecipeView}>
    <div className={css.RawRecipeLabel}>Recipe:</div>
    <div className={css.RawRecipeValue}
        // contentEditable={true} 
        // onInput={ e => { state.setFieldsFromRecipeJson(e.currentTarget.textContent!); e.preventDefault(); }}
    >
      {state.recipeJson == null ? (
        <i>{"{}"}</i>
      ) : (
      <EnhancedRecipeView recipeJson={ state.recipeJson  }/>
      )}
    </div>
  </div>
));