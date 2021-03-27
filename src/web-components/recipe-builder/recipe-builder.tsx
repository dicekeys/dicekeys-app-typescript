import React from "react";
import { makeAutoObservable } from "mobx";
import { observer  } from "mobx-react";
import { CachedApiCalls } from "../../state/cached-api-calls";
import { RecipeBuilderCommonState } from "./recipe-builder-common-state";
import { RecipeBuilderForTemplateState, RecipeBuilderForTemplateView } from "./recipe-builder-template";
import { DerivationRecipeTemplateList } from "../../dicekeys/derivation-recipe-templates";
import { RecipeBuilderCustomState } from "./recipe-builder-custom";
import css from "./recipe-builder.module.css";

export enum RecipeBuilderType {
  Custom,
  Template
};

export class RecipeBuilderViewState {
  type: RecipeBuilderType;
  builderStateForTemplate?: RecipeBuilderForTemplateState = new RecipeBuilderForTemplateState(DerivationRecipeTemplateList[0]);
  builderStateForCustom?: RecipeBuilderCustomState = new RecipeBuilderCustomState("Password");

  get subState(): RecipeBuilderCommonState {
    switch(this.type) {
      case RecipeBuilderType.Custom:
        return this.builderStateForCustom!;
      case RecipeBuilderType.Template:
        return this.builderStateForTemplate!;
    }
  }

  constructor(type: RecipeBuilderType = RecipeBuilderType.Custom) {
    this.type = type;
    makeAutoObservable(this);
  }
}

export const RecipeNameView = observer( ( props: {state: RecipeBuilderCommonState}) => (
  <div className={css.recipe_name}>Recipe for {props.state.name}</div>
));

export const RawRecipeView = observer( ( props: {state: RecipeBuilderCommonState}) => (
  <div>{ props.state.recipe }</div>
));

export const DerivedValueView = observer( ( props: {precalculatedApiCalls: CachedApiCalls, state: RecipeBuilderCommonState}) => (
  <div>{ props.precalculatedApiCalls.getPasswordForRecipe(props.state.recipe ?? "{}") }</div>
));

export const RecipeSelector = observer( ( props: {precalculatedApiCalls: CachedApiCalls, state: RecipeBuilderCommonState}) => (
  <div>{ props.precalculatedApiCalls.getPasswordForRecipe(props.state.recipe!) }</div>
));

export const RecipeBuilderView = observer( ( props: {seedString: string, viewState?: RecipeBuilderViewState}) => {
  const state = props.viewState ?? new RecipeBuilderViewState(RecipeBuilderType.Template);
  const {subState} = state;
  const precalculatedApiCalls = new CachedApiCalls(props.seedString)

  return (
    <div>
      <RecipeNameView state={subState} />
      <div className={css.recipe_header}>Recipe Fields</div>
      {
        (() => {
          switch(state.type) {
            // case RecipeBuilderType.Custom: return ( state.builderStateForCustom! );
            case RecipeBuilderType.Template: return (
              <RecipeBuilderForTemplateView state={state.builderStateForTemplate!} />
            );
            default: return null;
          }
        })()
      }
      <div className={css.recipe_header}>Internal Recipe Format</div>
      <RawRecipeView state={subState} />
      <div className={css.recipe_header}>Derived value</div>
      <DerivedValueView state={subState} precalculatedApiCalls={precalculatedApiCalls} />
    </div>
  );
});

