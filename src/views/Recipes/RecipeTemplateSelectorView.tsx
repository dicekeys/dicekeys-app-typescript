import css from "./recipe-builder.module.css";
import xcss from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { BuiltInRecipes } from "../../dicekeys/SavedRecipe";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { savedRecipeIdentifier, SelectedRecipeIdentifier, templateRecipeIdentifier, RecipeBuilderState } from "./RecipeBuilderState";

const SavedRecipesOptGroup = observer( () => {
  const savedRecipes = RecipeStore.recipes;
  if (savedRecipes.length ==0) return null;
  return (
    <optgroup key={"Saved Recipes"} label={"Saved Recipes"}>
      { savedRecipes.map( savedRecipe => (
        <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe.name)} >{ savedRecipe.name }</option>
      ))}
    </optgroup>
  );  
})

export const RecipeTemplateSelectorView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  return (
    <div className={css.field_row}
      onMouseEnter={state.showHelpForFn(undefined)}
    >
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <select
            className={xcss.SelectRecipe}
            value={ state.selectedRecipeState.recipeIdentifier ?? "" }
            placeholder={"Placeholder"}
            onChange={ (e) => {
              state.selectedRecipeState.setSelectedRecipeIdentifier(e.currentTarget.value as SelectedRecipeIdentifier | undefined);
              const {templateRecipe} = state.selectedRecipeState;
              if (templateRecipe) {
                state.loadSavedRecipe(templateRecipe)
              }
              state.showHelpFor(undefined);
            }}
          >
            <option key="none" disabled={true} hidden={true} value="">Select Recipe</option>
            {/* <option key="spacer" disabled={true} value="-"></option> */}
            <SavedRecipesOptGroup/>
            <optgroup key={"Built-in recipes"} label={"Built-in recipes"}>
              { BuiltInRecipes.map( template => (
                <option key={template.name} value={templateRecipeIdentifier(template.name)} >{ template.name }</option>
              ))}
            </optgroup>
            {/* <optgroup key={"Custom recipes"} label={"Custom"}>
              { DerivableObjectNameList.map( (recipeType) => (
                <option key={ recipeType } value={ recipeType } >{ describeRecipeType(recipeType) }</option>
              ))}              
            </optgroup> */}
          </select>  
          {/* <button onClick={ () => sequenceNumberState.setSequenceNumber( Math.max(1, (sequenceNumberState.sequenceNumber ?? 1) - 1 )) } >-</button> */}
        </div>
        {/* <label className={css.label_below}>Secret type</label> */}
      </div>
    </div>
  );
});