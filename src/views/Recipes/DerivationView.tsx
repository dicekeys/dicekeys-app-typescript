import css from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderView } from ".";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { RecipeBuilderState, SelectedRecipeState } from "./RecipeBuilderState";
import { RecipeTemplateSelectorView } from "./RecipeTemplateSelectorView";
import { DiceKey } from "~dicekeys/DiceKey";
import { RecipesDerivedValuesView } from "./RecipesDerivedValuesView";

interface DerivationViewProps {
  seedString: string;
}

export const DerivationViewWithState = observer( ( {selectedRecipeState, recipeBuilderState}: {
  selectedRecipeState: SelectedRecipeState,
  recipeBuilderState: RecipeBuilderState
}) => (
  <div className={css.DerivationView}>
    <RecipeTemplateSelectorView {...{selectedRecipeState, state: recipeBuilderState}} />
    <RecipeBuilderView state={recipeBuilderState} />
    <RecipesDerivedValuesView {...{state: recipeBuilderState}} />
  </div>
));
export const DerivationView = observer ( (props: DerivationViewProps) => {
  const selectedRecipeState = new SelectedRecipeState();
  const recipeBuilderState =  new RecipeBuilderState(selectedRecipeState, new CachedApiCalls(props.seedString));
  return (
    <DerivationViewWithState {...{selectedRecipeState, recipeBuilderState}}/>
  )
});

export const Preview_DerivationView = () => (
  <DerivationView seedString={DiceKey.toSeedString(DiceKey.testExample, true) } />
)
// export const DerivationViewPreview 