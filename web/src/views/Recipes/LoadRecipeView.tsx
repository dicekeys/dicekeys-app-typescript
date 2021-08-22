import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { BuiltInRecipes, enhancedStoredRecipeName, getStoredRecipe, savedRecipeIdentifier, builtInRecipeIdentifier, customRecipeIdentifier } from "../../dicekeys/StoredRecipe";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivableObjectNameList, describeRecipeType } from "./DescribeRecipeType";

export const SelectRecipeToLoadView = observer( ({state}: {
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
    <select
      title="Select recipe"
      className={state.recipeIdentifier ? css.SelectRecipe : css.SelectRecipeNoneSelectedYet}
      // value={ state.recipeIdentifier ?? "" }
      value={state.recipeIdentifier ?? (state.type && customRecipeIdentifier({type: state.type})) ?? ""}
      placeholder={"Placeholder"}
      onChange={ (e) => {
        state.loadRecipe(getStoredRecipe(e.currentTarget.value));
        state.setFieldInFocus(undefined);
      }}
    >
      <option key="none" disabled={true} hidden={true} value="">secret from ...</option>
      {savedRecipes.length == 0 ? (<></>) : (
        <optgroup key={"Saved Recipes"} label={"use a saved recipe"}>
          { savedRecipes.map( savedRecipe => (
            <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe)} >{ enhancedStoredRecipeName(savedRecipe) }</option>
          ))}
        </optgroup>
      )}
      <optgroup key={"Built-in recipes"} label={"use a built-in recipe"}>
        { builtInRecipes.map( template => (
          <option key={template.name} value={builtInRecipeIdentifier(template)} >{ enhancedStoredRecipeName(template) }</option>
        ))}
      </optgroup>
      <optgroup key={"Custom"} label={"create a new recipe for a:"}>
        { DerivableObjectNameList.map( (recipeType) => (
          <option key={ recipeType } value={ customRecipeIdentifier({type: recipeType}) } >{ describeRecipeType(recipeType) }</option>
        ))}      
      </optgroup>
    </select>
  );
});

export const LoadRecipeView = ({state}: {
  state: RecipeBuilderState,
}) => (
    <div className={css.LoadRecipeView} >
      (Re)create a &nbsp;
      <SelectRecipeToLoadView {...{state}} />
    </div>
);