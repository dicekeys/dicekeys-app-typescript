import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { BuiltInRecipes, enhancedStoredRecipeName, getStoredRecipe, savedRecipeIdentifier, builtInRecipeIdentifier, customRecipeIdentifier } from "../../dicekeys/StoredRecipe";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivableObjectNameList, describeRecipeType } from "./DescribeRecipeType";

export const LoadRecipeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  const savedRecipes = RecipeStore.recipes;
  // Remove any saved recipes from the set of built-in recipes
  const builtInRecipes = BuiltInRecipes.filter(
    builtInRecipe => savedRecipes.every( savedRecipe =>
      builtInRecipe.recipeJson != savedRecipe.recipeJson ||
      builtInRecipe.type != savedRecipe.type  ||
      builtInRecipe.name != savedRecipe.name
    )
  )
  return (
    <div className={"FIXME"}
      onMouseEnter={state.showHelpForFn(undefined)}
    >
      <div>
        <select
          className={css.SelectRecipe}
          // value={ state.recipeIdentifier ?? "" }
          value={""}
          placeholder={"Placeholder"}
          onChange={ (e) => {
            state.loadRecipe(getStoredRecipe(e.currentTarget.value));
            state.showHelpFor(undefined);
          }}
        >
          <option key="none" disabled={true} hidden={true} value="">Open or Create Recipe</option>
          {savedRecipes.length == 0 ? (<></>) : (
            <optgroup key={"Saved Recipes"} label={"Saved Recipes"}>
              { savedRecipes.map( savedRecipe => (
                <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe)} >{ enhancedStoredRecipeName(savedRecipe) }</option>
              ))}
            </optgroup>
          )}
          <optgroup key={"Built-in recipes"} label={"Built-in recipes"}>
            { builtInRecipes.map( template => (
              <option key={template.name} value={builtInRecipeIdentifier(template)} >{ enhancedStoredRecipeName(template) }</option>
            ))}
          </optgroup>
          <optgroup key={"Custom"} label={"Custom recipe"}>
            { DerivableObjectNameList.map( (recipeType) => (
              <option key={ recipeType } value={ customRecipeIdentifier({type: recipeType}) } >{ describeRecipeType(recipeType) }</option>
            ))}      
          </optgroup>
        </select>
        {/* <button
          hidden={!state.recipeIdentifier || state.editingMode != null}
          onClick={state.setStartEditing}
        >edit</button>
        <button
          hidden={!state.savedRecipeIdentifer}
          onClick={() => {
            const {savedRecipeIdentifer} = state;
            if (savedRecipeIdentifer) {
              RecipeStore.removeRecipe(savedRecipeIdentifierToStoredRecipe(savedRecipeIdentifer));
            }
          }}
        >delete</button> */}
      </div>
    </div>
  );
});