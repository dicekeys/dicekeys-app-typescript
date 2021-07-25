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
import { DiceKeyViewAutoSized } from "../../views/SVG/DiceKeyView";
import { ToggleState } from "../../state";

interface DerivationViewProps {
  diceKey: DiceKey;
}

export const DerivationViewWithState = observer( ( {diceKey, recipeBuilderState, derivedFromRecipeState}: {
  diceKey: DiceKey,
  recipeBuilderState: RecipeBuilderState,
  derivedFromRecipeState: DerivedFromRecipeState
}) => (
  <ContentBox>
    <LoadRecipeView state={recipeBuilderState} />
    <Spacer/>
    <div className={css.DerivationView}>
      <RecipeBuilderView state={recipeBuilderState} />
      <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
        <DiceKeyViewAutoSized faces={diceKey.faces} maxHeight="16vh" maxWidth="32vw"
          obscureAllButCenterDie={ToggleState.ObscureDiceKey}
        /><span style={{"marginLeft": "1vw", marginRight: "1vw", fontSize:"3vw"}}>+</span>
        hey
      </div>
      <DerivedFromRecipeView state={derivedFromRecipeState} />
    </div>
    <Spacer/>
  </ContentBox>
));
export const DerivationView = observer ( (props: DerivationViewProps) => {
  const {diceKey} = props;
  const seedString = diceKey.toSeedString();
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString});
  return (
    <DerivationViewWithState {...{diceKey, recipeBuilderState, derivedFromRecipeState}}/>
  )
});

export const Preview_DerivationView = () => (
  <DerivationView diceKey={DiceKey.testExample} />
)
