import css from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { BuiltInRecipes, savedRecipeIdentifier, templateRecipeIdentifier } from "../../dicekeys/SavedRecipe";
import { getStoredRecipe, RecipeStore } from "../../state/stores/RecipeStore";
import { RecipeBuilderState } from "./RecipeBuilderState";

// const SavedRecipesOptGroup = observer( () => {
//   const savedRecipes = RecipeStore.recipes;
//   return savedRecipes.length == 0 ? (<></>) : (
//     <optgroup key={"Saved Recipes"} label={"Saved Recipes"}>
//       { savedRecipes.map( savedRecipe => (
//         <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe.name)} >{ savedRecipe.name }</option>
//       ))}
//     </optgroup>
//   );  
// })

export const LoadRecipeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  const savedRecipes = RecipeStore.recipes;
  return (
    <div className={css.field_row}
      onMouseEnter={state.showHelpForFn(undefined)}
    >
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <select
            className={css.SelectRecipe}
            value={ state.matchingBuiltInRecipe?.name == null ? "" :
                templateRecipeIdentifier(state.matchingBuiltInRecipe?.name)
              }
            placeholder={"Placeholder"}
            onChange={ (e) => {
              // state.selectedRecipeState.setSelectedRecipeIdentifier(e.currentTarget.value as SelectedRecipeIdentifier | undefined);
              state.loadRecipe(getStoredRecipe(e.currentTarget.value))
              state.showHelpFor(undefined);
            }}
          >
            <option key="none" disabled={true} hidden={true} value="">Select Recipe</option>
            {savedRecipes.length == 0 ? (<></>) : (
              <optgroup key={"Saved Recipes"} label={"Saved Recipes"}>
                { savedRecipes.map( savedRecipe => (
                  <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe.name)} >{ savedRecipe.name }</option>
                ))}
              </optgroup>
            )}
            <optgroup key={"Built-in recipes"} label={"Built-in recipes"}>
              { BuiltInRecipes.map( template => (
                <option key={template.name} value={templateRecipeIdentifier(template.name)} >{ template.name }</option>
              ))}
            </optgroup>
          </select>  
        </div>
      </div>
    </div>
  );
});