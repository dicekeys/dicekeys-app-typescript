import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { RecipeBuilderState, RecipeEditingMode } from "./RecipeBuilderState";
import { savedRecipeIdentifierToStoredRecipe, StoredRecipe } from "../../dicekeys/StoredRecipe";
import { visibility } from "../../utilities/visibility";
import { runInAction } from "mobx";

export const SaveRecipeView = observer( ( {state}: {state: RecipeBuilderState}) => {
  const {name, recipeJson, type} = state;
  if (type == null || recipeJson == null) {
    return null;
  }
  
  const saveOrDelete = () => {
    const {savedRecipeIdentifier} = state;
    if (savedRecipeIdentifier) {
      // This is already saved so must be the delete button
      RecipeStore.removeRecipe(savedRecipeIdentifierToStoredRecipe(savedRecipeIdentifier));
    } else {
      if (recipeJson==null) return;
      const storedRecipe: StoredRecipe = {name, recipeJson, type};
      runInAction( () => {
        RecipeStore.addRecipe(storedRecipe);
        state.setOrigin("Saved");
        state.toggleEditingMode(RecipeEditingMode.NoEdit);
      });
    }
  } 
  
  return (
    <div className={css.SaveRecipeSubRow}>
      {/* <input disabled={!state.editingMode} type="text"
        className={css.SaveRecipeName} value={state.name}
        placeholder={ state.prescribedName }
        size={ Math.max(8, (state.name.length || state.prescribedName?.length || 0) + 1) }
        onInput={ (e) => state.setName( e.currentTarget.value )}
        onFocus={ (e) => {
          if (e.currentTarget.value.length == 0 && state.prescribedName) {
            state.setName( state.prescribedName);
          }
        }}  
      />
      <span className={css.SaveRecipeNameExtension} >&nbsp;{ getStoredRecipeNameSuffix(state) }&nbsp;</span> */}
      <button
        className={css.SaveButton}
        style={visibility(state.prescribedName != null || (state.name != null && state.name.length > 0))}
        onClick={saveOrDelete}
        >{state.savedRecipeIdentifier ? "delete" : "save"}
      </button>
    </div>
    )
  }
);