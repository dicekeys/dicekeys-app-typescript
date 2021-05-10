import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { DerivationRecipeType } from "../../dicekeys/StoredRecipe";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivableObjectNameList, describeRecipeType } from "./DescribeRecipeType";
import { SaveRecipeView } from "./SaveRecipeView";


export const RecipeTypeSelectorView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  return (
    <div className={css.SelectAndSaveRow}>
      <span hidden={state.editingMode == null}>
        Derive a&nbsp;
        <select
          className={css.SelectDerivedField}
          value={ state.type ?? "" }
          onMouseEnter={state.showHelpForFn(undefined)}
          onChange={ (e) => {
            state.setType(e.currentTarget.value as DerivationRecipeType | undefined);
            state.setStartEditing();
            state.showHelpFor(undefined);
          }}
        >
          <option key="none" disabled={true} hidden={true} value="">...</option>
          { DerivableObjectNameList.map( (recipeType) => (
            <option key={ recipeType } value={ recipeType } >{ describeRecipeType(recipeType) }</option>
          ))}              
        </select>
      </span>
      <SaveRecipeView state={state} />
    </div>
  );
});