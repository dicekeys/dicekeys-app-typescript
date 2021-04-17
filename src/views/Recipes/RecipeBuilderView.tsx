import React from "react";
import { observer  } from "mobx-react";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { RecipeBuilderState, SelectedRecipeState } from "./RecipeBuilderState";
import { RecipeBuilderSettingsView } from "./RecipeBuilderSettingsView";
import css from "./recipe-builder.module.css";
import { SecretFieldsCommonObscureButton } from "../../views/basics";
import { RecipesDerivedValuesView } from "./RecipesDerivedValuesView";
import { RecipeTypeSelectorView } from "./RecipeTypeSelectorView";


export enum RecipeBuilderType {
  Custom,
  Template
};

export const RecipeNameView = observer( ( props: {state: RecipeBuilderState}) => {
  return props.state.name ? (
    <div className={css.recipe_name}>Recipe for {props.state.name}</div>
    ) : (
      <div className={css.recipe_name}>New recipe</div>
    )
  }
);

export const RawRecipeView = observer( ( props: {state: RecipeBuilderState}) => (
  <div>{ props.state.recipeJson }</div>
));


export const RecipeView = observer( ( props: {seedString: string /*, builderState: RecipeBuilderState */}) => {
  const selectedRecipeState = new SelectedRecipeState();
  const builderState = new RecipeBuilderState(selectedRecipeState);
  // const state = props.builderState;
  const precalculatedApiCalls = new CachedApiCalls(props.seedString)

  return (
    <div>
      <RecipeTypeSelectorView state={selectedRecipeState} />
      <RecipeNameView state={builderState} />
      <div className={css.recipe_header}>Recipe Fields</div>
      <RecipeBuilderSettingsView state={builderState} />
      <div className={css.recipe_header}>Internal Recipe Format</div>
      <RawRecipeView state={builderState} />
      <div className={css.recipe_header}>Derived values <SecretFieldsCommonObscureButton/></div>
      <RecipesDerivedValuesView state={builderState} precalculatedApiCalls={precalculatedApiCalls} />
    </div>
  );
});

