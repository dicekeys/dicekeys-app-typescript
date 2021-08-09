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
import { MultilineRecipeView } from "./MultilineRecipeView";

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
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
          {/* Key */}
          <span style={{width: "min(22.5vh, 25vw)", height: "min(22.5vh, 25vw)"}}>
            <DiceKeyViewAutoSized faces={diceKey.faces} maxHeight="22.5vh" maxWidth="25vw"
              obscureAllButCenterDie={ToggleState.ObscureDiceKey}
            />
          </span>
          {/* Plus sign */}
          <span style={{width: "5vw", textAlign: "center", fontSize:"3vw"}}>+</span>
          {/* Recipe */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            width: "calc(60vw - 0.7rem)",
            backgroundColor: "rgba(128,128,196,0.10)",
            padding: "0.35rem",
            borderRadius: "0.35rem",
            color: "rgba(0, 0, 0, 0.5)",
            minHeight: "calc(min(22.5vh, 25vw) - 0.7rem)",
          }}>
            <MultilineRecipeView state={recipeBuilderState} />
          </div>
        </div>
        <div style={{display: "flex", flexDirection: "row", alignItems: "flex-start"}}>
          <div style={{display: "flex", flexDirection: "row", width: "min(22.5vh, 25vw)", justifyContent: "center", alignItems: "baseline", color: "rgba(0, 0, 0, 0.5)"}}>
            Key
          </div>
          <div style={{width: "5vw", textAlign: "center", fontSize: "3vw", paddingTop: "0.2vh"}}>
            &#8659;
          </div>
          <div style={{width: "60vw", textAlign: "center", color: "rgba(0, 0, 0, 0.5)"}}>
            Recipe
          </div>
        </div>
        {/* <div style={{width: "5vw", paddingLeft:"min(22.5vh, 25vw)", textAlign: "center", fontSize: "3vw"}}>
          &#8659;
        </div> */}
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
