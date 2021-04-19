import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { DerivationRecipeType } from "../../dicekeys/SavedRecipe";
import { DerivationRecipeTemplateList } from "../../dicekeys/DerivationRecipeTemplateList";
import { RecipeStore } from "~state/stores/RecipeStore";
import { savedRecipeIdentifier, SelectedRecipeState, SelectedRecipeIdentifier, templateRecipeIdentifier } from "./RecipeBuilderState";

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

export const RecipeTypeSelectorView = observer( ({state}: {state: SelectedRecipeState}) => {
  const recipeTypesToSelectFrom: [DerivationRecipeType, string][] = [
    ["Password", "Password"],
    ["Secret", "Seed or other secret"],
    ["SymmetricKey", "Cryptographic key (symmetric)"],
    ["UnsealingKey", "Cryptographic key (public/private)"],
  ]
  return (
    <div className={css.field_row}>
      <div className={css.vertical_labeled_field}>
        <div className={css.hstack}>
          <select value={ state.recipeIdentifier } onChange={ (e) => state.setSelectedRecipeIdentifier(e.currentTarget.value as SelectedRecipeIdentifier | undefined) }>
            <option key="none"></option>
            <SavedRecipesOptGroup/>
            <optgroup key={"Built-in recipes"} label={"Built-in recipes"}>
              { DerivationRecipeTemplateList.map( template => (
                <option key={template.name} value={templateRecipeIdentifier(template.name)} >{ template.name }</option>
              ))}
            </optgroup>
            <optgroup key={"Custom recipes"} label={"Custom"}>
              { recipeTypesToSelectFrom.map( ([recipeType, recipeName]) => (
                <option key={ recipeType } value={ recipeType } >{ recipeName }</option>
              ))}              
            </optgroup>
          </select>  
          {/* <button onClick={ () => sequenceNumberState.setSequenceNumber( Math.max(1, (sequenceNumberState.sequenceNumber ?? 1) - 1 )) } >-</button> */}
        </div>
        <label className={css.label_below}>Secret type</label>
      </div>
    </div>
  );
});