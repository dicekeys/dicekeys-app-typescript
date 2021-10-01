import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { BuiltInRecipes, enhancedStoredRecipeName, getStoredRecipe, savedRecipeIdentifier, builtInRecipeIdentifier, customRecipeIdentifier } from "../../dicekeys/StoredRecipe";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivableObjectNameList, describeRecipeType } from "./DescribeRecipeType";

export const SelectRecipeToLoadView = observer( ({
  state,
  defaultOptionLabel = "secret from ..."
}: {
  state: RecipeBuilderState,
  defaultOptionLabel?: string
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
      className={state.recipeIdentifier ? css.SelectRecipe : css.SelectRecipeNoneSelectedYet}
      // value={ state.recipeIdentifier ?? "" }
      value={state.recipeIdentifier ?? (state.type && customRecipeIdentifier({type: state.type})) ?? ""}
      placeholder={"Placeholder"}
      onChange={ (e) => {
        state.loadRecipe(getStoredRecipe(e.currentTarget.value));
        state.setFieldInFocus(undefined);
      }}
    >
      <option key="none" disabled={true} hidden={true} value="">{defaultOptionLabel}</option>
      {savedRecipes.length == 0 ? (<></>) : (
        <optgroup key={"Saved Recipes"} label={"use a saved recipe"}>
          { savedRecipes.map( savedRecipe => {
            const id = savedRecipeIdentifier(savedRecipe);
            return (
              <option key={ id } value={ id } >{ enhancedStoredRecipeName(savedRecipe) }</option>
            )
          })}
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



export const CreateANewRecipeOfTypeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  return (
    <>
    <label>Create a recipe for a new:</label>
    <select
      className={state.recipeIdentifier ? css.SelectRecipe : css.SelectRecipeNoneSelectedYet}
//      placeholder={"Placeholder"}
      onChange={ (e) => {
        state.loadRecipe(getStoredRecipe(e.currentTarget.value));
      }}
    >
      <option key="none" value="">...</option>
      { DerivableObjectNameList.map( (recipeType) => (
          <option key={ recipeType } value={ customRecipeIdentifier({type: recipeType}) } >{ describeRecipeType(recipeType) }</option>
      ))}      
    </select>
    </>
  );
});


export const LoadBuiltInRecipeView = observer( ({state}: {
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
    <div>
      <label>Load built-in recipe:</label>
      <select
          className={state.recipeIdentifier ? css.SelectRecipe : css.SelectRecipeNoneSelectedYet}
  //      placeholder={"Placeholder"}
        onChange={ (e) => {
          state.loadRecipe(getStoredRecipe(e.currentTarget.value));
        }}
      >
      <option key="none" value="">...</option>
        { builtInRecipes.map( template => (
          <option key={template.name} value={builtInRecipeIdentifier(template)} >{ enhancedStoredRecipeName(template) }</option>
        ))}
      </select>
    </div>
  );
});

export const LoadSavedRecipeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  const savedRecipes = RecipeStore.recipes;
  if (savedRecipes.length === 0) return null;
  return (
    <div>
      <label>Load saved recipe:</label>
      <select
        title="Load saved recipe"
        className={state.recipeIdentifier ? css.SelectRecipe : css.SelectRecipeNoneSelectedYet}
        placeholder={"Placeholder"}
        onChange={ (e) => {
          state.loadRecipe(getStoredRecipe(e.currentTarget.value));
        }}
      >
        <option key="none" value="">...</option>
        {savedRecipes.map( savedRecipe => (
              <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe)} >{ enhancedStoredRecipeName(savedRecipe) }</option>
            ))}
      </select>
    </div>
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