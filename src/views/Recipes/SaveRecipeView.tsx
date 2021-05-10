import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeStore } from "~state/stores/RecipeStore";
import { action } from "mobx";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { getStoredRecipeNameSuffix, StoredRecipe } from "../../dicekeys/StoredRecipe";

export const SaveRecipeView = observer( ( {state}: {state: RecipeBuilderState}) => {
  const {name, recipeJson, type} = state;
  if (type == null || recipeJson == null) {
    return null;
  }
  const storedRecipe: StoredRecipe = {name, recipeJson, type};
  const isAlreadySaved = RecipeStore.isRecipeSaved(storedRecipe);
  const disableSaveButton = isAlreadySaved || name == null || name.length === 0; // ||

  const save = recipeJson && name != null && name.length > 0 && recipeJson.length > 0 ? action ( () => {
    RecipeStore.addRecipe(storedRecipe);
    // alert(`Added ${type}:${name}:${recipeJson}`)
  }) : undefined;
  return (
    <div className={css.SaveRecipeSubRow}>
      <button className={css.SaveButton} hidden={disableSaveButton} onClick={save}>{ "save as" }</button>
      <input disabled={state.editingMode == null} type="text" className={css.SaveRecipeName} value={state.name} placeholder={ state.prescribedName } size={ (state.name.length || state.prescribedName?.length || 0) + 1}
        onInput={ (e) => state.setName( e.currentTarget.value )}
        onFocus={ (e) => {
          if (e.currentTarget.value.length == 0 && state.prescribedName) {
            state.setName( state.prescribedName);
          }
        }}  
      />
      <span className={css.SaveRecipeNameExtension} >&nbsp;{ getStoredRecipeNameSuffix(storedRecipe) }&nbsp;</span>
    </div>
    )
  }
);