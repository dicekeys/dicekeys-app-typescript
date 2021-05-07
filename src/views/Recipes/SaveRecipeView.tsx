import css from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeStore } from "~state/stores/RecipeStore";
import { action } from "mobx";
import { RecipeBuilderState, savedRecipeIdentifier } from "./RecipeBuilderState";

export const SaveRecipeView = observer( ( {state}: {state: RecipeBuilderState}) => {
  const {name = state.prescribedName, recipeJson, type, selectedRecipeState} = state;
  if (!type || typeof recipeJson === "undefined") {
    return null;
  }
  const isNameSaved = state.name && RecipeStore.recipeForName(state.name);
  const isIdenticalToSaved = isNameSaved &&
    RecipeStore.recipeForName(state.name!)?.type === state.type &&
    RecipeStore.recipeForName(state.name!)?.recipeJson === state.recipeJson;
    const disableSaveButton = isIdenticalToSaved || typeof name === "undefined" || name.length === 0 ||
    (
      selectedRecipeState.savedRecipe?.name === state.name &&
      selectedRecipeState.savedRecipe?.type === state.type &&
      selectedRecipeState.savedRecipe?.recipeJson === state.recipeJson
    )
    const saveWillReplace = isNameSaved && !isIdenticalToSaved;

    const save = recipeJson && name != null && name.length > 0 && recipeJson.length > 0 ? action ( () => {
    RecipeStore.addRecipe({name, type, recipeJson});
    selectedRecipeState.setSelectedRecipeIdentifier(savedRecipeIdentifier(name));
    // alert(`Added ${type}:${name}:${recipeJson}`)
  }) : undefined;
  const remove = isIdenticalToSaved && name ? action ( () => {
    RecipeStore.removeRecipeByName(name);
    selectedRecipeState.setSelectedRecipeIdentifier(savedRecipeIdentifier(name));
    // alert(`Removed ${type}:${name}:${recipeJson}`)
  }) : undefined;
  return (
    <div style={{display: "flex", marginTop: "0.5rem", flexDirection: "row",  "justifyContent": "flex-end"}}>
      <input type="text" className={css.RecipeName} placeholder={ state.name } onInput={ (e) => state.setName( e.currentTarget.value )} />
      <button className={css.SaveButton} disabled={disableSaveButton} onClick={save}>{ saveWillReplace ? "replace" : "save" }</button>
      <button className={css.DeleteButton} style={{visibility: isIdenticalToSaved ? "visible" : "hidden"}} onClick={remove}>delete</button>
    </div>
    )
  }
);