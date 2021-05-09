import css from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { BuiltInRecipes, enhancedStoredRecipeName, getStoredRecipe, savedRecipeIdentifier, templateRecipeIdentifier } from "../../dicekeys/StoredRecipe";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { RecipeBuilderState } from "./RecipeBuilderState";

export const LoadRecipeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  const savedRecipes = RecipeStore.recipes;
  return (
    <div className={css.field_row}
      onMouseEnter={state.showHelpForFn(undefined)}
    >
      <div>
        <select
          className={css.SelectRecipe}
          value={ state.matchingBuiltInRecipe?.name == null ? "" :
              templateRecipeIdentifier(state.matchingBuiltInRecipe)
            }
          placeholder={"Placeholder"}
          onChange={ (e) => {
            state.loadRecipe(getStoredRecipe(e.currentTarget.value))
            state.showHelpFor(undefined);
          }}
        >
          <option key="none" disabled={true} hidden={true} value="">Load Recipe</option>
          {savedRecipes.length == 0 ? (<></>) : (
            <optgroup key={"Saved Recipes"} label={"Saved Recipes"}>
              { savedRecipes.map( savedRecipe => (
                <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe)} >{ enhancedStoredRecipeName(savedRecipe) }</option>
              ))}
            </optgroup>
          )}
          <optgroup key={"Built-in recipes"} label={"Built-in recipes"}>
            { BuiltInRecipes.map( template => (
              <option key={template.name} value={templateRecipeIdentifier(template)} >{ enhancedStoredRecipeName(template) }</option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
});