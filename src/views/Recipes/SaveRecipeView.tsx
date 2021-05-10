import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeStore } from "~state/stores/RecipeStore";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { getStoredRecipeNameSuffix, savedRecipeIdentifierToStoredRecipe, StoredRecipe } from "../../dicekeys/StoredRecipe";

export const SaveRecipeView = observer( ( {state}: {state: RecipeBuilderState}) => {
  const {name, recipeJson, type} = state;
  if (type == null || recipeJson == null) {
    return null;
  }
  



  const saveOrDelete = () => {
    const {savedRecipeIdentifer} = state;
    if (savedRecipeIdentifer) {
      // This is already saved so must be the delete button
      RecipeStore.removeRecipe(savedRecipeIdentifierToStoredRecipe(savedRecipeIdentifer));
    } else {
      const storedRecipe: StoredRecipe = {name, recipeJson, type};
      RecipeStore.addRecipe(storedRecipe)
    }
  }

  return (
    <div className={css.SaveRecipeSubRow}>
      <button
        hidden={!state.recipeIdentifier || state.editingMode != null}
        onClick={state.setStartEditing}
      >edit</button>
      <button className={css.SaveButton}
        hidden={state.name == null || state.name.length == 0}
        onClick={saveOrDelete}
        >{state.savedRecipeIdentifer ? "delete" : "save as"}</button>
      <input disabled={state.editingMode == null} type="text" className={css.SaveRecipeName} value={state.name} placeholder={ state.prescribedName } size={ (state.name.length || state.prescribedName?.length || 0) + 1}
        onInput={ (e) => state.setName( e.currentTarget.value )}
        onFocus={ (e) => {
          if (e.currentTarget.value.length == 0 && state.prescribedName) {
            state.setName( state.prescribedName);
          }
        }}  
      />
      <span className={css.SaveRecipeNameExtension} >&nbsp;{ getStoredRecipeNameSuffix(state) }&nbsp;</span>
    </div>
    )
  }
);