import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { DerivationRecipeType } from "../../dicekeys/StoredRecipe";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivableObjectNameList, describeRecipeType } from "./DescribeRecipeType";
import { SaveRecipeView } from "./SaveRecipeView";


const RecipeTypeSelectorView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  return (
      <div className={css.RecipeSelectorSubRow} hidden={!state.editing}>
        Derive a&nbsp;
        <select
          className={css.SelectDerivedField}
          value={ state.type ?? "" }
          onMouseEnter={state.showHelpForFn(undefined)}
          onChange={ (e) => {
            state.setType(e.currentTarget.value as DerivationRecipeType | undefined);
            state.setStartEditing();
            state.showHelpFor("purpose");
          }}
        >
          <option key="none" disabled={true} hidden={true} value="">...</option>
          { DerivableObjectNameList.map( (recipeType) => (
            <option key={ recipeType } value={ recipeType } >{ describeRecipeType(recipeType) }</option>
          ))}              
        </select>
      </div>
  );
});

export const SelectAndSaveTableHeaderView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  return (
    <div className={css.SelectAndSaveRow}>
      <SaveRecipeView state={state} />
      <RecipeTypeSelectorView state={state} />
    </div>
  );
});