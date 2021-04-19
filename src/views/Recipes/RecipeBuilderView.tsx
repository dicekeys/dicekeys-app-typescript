import React from "react";
import { observer  } from "mobx-react";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { RecipeBuilderSettingsView } from "./RecipeBuilderSettingsView";
import css from "./recipe-builder.module.css";


export const RawRecipeView = observer( ( props: {state: RecipeBuilderState}) => (
  <div>{ props.state.recipeJson }</div>
));


export const RecipeView = observer( ( props: {
    state: RecipeBuilderState /*, builderState: RecipeBuilderState */
    cachedApiCalls: CachedApiCalls
  }) => {
  return (
    <div>
      <div className={css.recipe_header}>Recipe Fields</div>
      <RecipeBuilderSettingsView state={props.state} />
    </div>
  );
});

