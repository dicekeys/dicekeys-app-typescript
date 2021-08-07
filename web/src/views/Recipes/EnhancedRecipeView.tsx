import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DiceKeysAppSecretRecipe } from "../../dicekeys";
import { JsxReplacer } from "../../utilities/JsxReplacer";

export const EnhancedRecipeView = ({recipeJson}: {recipeJson?: string}) => {
  try {
    const recipe = (recipeJson == null ? {} : JSON.parse(recipeJson)) as DiceKeysAppSecretRecipe;
    const replacer = new JsxReplacer(recipeJson ?? "");
    const sequenceNumber = recipe["#"];
    if (sequenceNumber != null && sequenceNumber >= 2) {
      replacer.replace(`"#":${sequenceNumber}`, (<>
          "#":<span className={css.sequence_number_span}>{sequenceNumber}</span>
        </>));
    }
    const lengthInChars = recipe.lengthInChars;
    if (lengthInChars != null) {
      replacer.replace(`"lengthInChars":${lengthInChars}`, (<>
          "lengthInChars":
          <span className={[css.FormattedRecipeSpan, css.length_span].join(" ")}>{lengthInChars}</span>
        </>));
    }
    const purpose = recipe.purpose;
    if (purpose != null) {
      const jsonEncodedPurpose = JSON.stringify(purpose)
      const jsonEscapedPurpose = jsonEncodedPurpose.substr(1, jsonEncodedPurpose.length - 2);
      replacer.replace(`"purpose":${jsonEncodedPurpose}`, (<>
          "purpose":"<span className={[css.FormattedRecipeSpan, css.host_name_span].join(" ")}>{jsonEscapedPurpose}</span>"
        </>));
    }
    const allow = recipe.allow;
    if (allow != null) {
      allow.forEach( ({host}) => {
        replacer.replace(`"host":"${host}"`, (<>
          "host":"<span className={[css.FormattedRecipeSpan, css.host_name_span].join(" ")}>{
            host
          }</span>"
        </>));
      });
    }
    return (
      <>
        {replacer.replacement.map( (item, index) => (
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