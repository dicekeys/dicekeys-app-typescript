import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderView } from ".";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { LoadRecipeView } from "./LoadRecipeView";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { ContentBox, Spacer } from "../basics";

interface DerivationViewProps {
  seedString: string;
}

export const DerivationViewWithState = observer( ( {recipeBuilderState, derivedFromRecipeState}: {
  recipeBuilderState: RecipeBuilderState
  derivedFromRecipeState: DerivedFromRecipeState
}) => (
  <ContentBox>
    <LoadRecipeView state={recipeBuilderState} />
    <Spacer/>
    <div className={css.DerivationView}>
      <RecipeBuilderView state={recipeBuilderState} />
      <DerivedFromRecipeView state={derivedFromRecipeState} />
    </div>
    <Spacer/>
  </ContentBox>
));
export const DerivationView = observer ( (props: DerivationViewProps) => {
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString: props.seedString});
  return (
    <DerivationViewWithState {...{recipeBuilderState, derivedFromRecipeState}}/>
  )
});

export const Preview_DerivationView = () => (
  <DerivationView seedString={DiceKey.testExample.toSeedString()} />
)
