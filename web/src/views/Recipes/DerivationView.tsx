import * as Dimensions from "./DerivationView/Dimensions";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, WizardStep } from "./RecipeBuilderState";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { Spacer } from "../basics";
import { RecipeWizardView } from "./DerivationView/RecipeWizardView";
import {KeyPlusRecipeView} from "./DerivationView/KeyPlusRecipeView";
import { RecipeFieldEditorView } from "./DerivationView/RecipeFieldEditorView";

// Complete design of fields with null values (add button)
// Add raw JSON editor
// Add save feature
// Remove +- from editor if field editor showing
// Add raw JSON option in wizard

export const RecipeWizardOrFieldsView = observer( ({recipeBuilderState}: {
  recipeBuilderState: RecipeBuilderState,
}) => recipeBuilderState.wizardStep <= WizardStep.EnterAddressOrPurpose ? (
    <RecipeWizardView state={recipeBuilderState} />
  ) : (
    <RecipeFieldEditorView state={recipeBuilderState} />
  )
);

export const DerivedFromRecipeViewOrPlaceholder = observer( ( {recipeBuilderState, derivedFromRecipeState}: {
  recipeBuilderState: RecipeBuilderState,
  derivedFromRecipeState: DerivedFromRecipeState,
}) => (
  <DerivedFromRecipeView {...{showPlaceholder: !recipeBuilderState.wizardComplete, state: derivedFromRecipeState}} />
));

const ColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
}

const centeredColumnStyle: React.CSSProperties = {
  ...ColumnStyle,
  alignItems: "center",
}


export const DerivationView = ( ({diceKey}: {
  diceKey: DiceKey;
}) => {
  const seedString = diceKey.toSeedString();
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString});
  return (
    <div style={{marginLeft: "5vw", marginRight: "5vw",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <Spacer/>
      <div style={{...centeredColumnStyle,
        justifyContent: "flex-end",
        height: `${Dimensions.WizardOrFieldsMaxHeight}vh`}}
      >
        <RecipeWizardOrFieldsView {...{recipeBuilderState}} />
      </div>
      <Spacer/>
      <div style={{...centeredColumnStyle, justifyContent: "flex-end"}}
      >
        <KeyPlusRecipeView {...{diceKey, recipeBuilderState}} />
      </div>
      {/* No spacer here since arrow should connect recipe to derived value */}
      <div style={{...ColumnStyle, alignItems: "flex-start", justifyContent: "flex-start",
        height: `${Dimensions.DerivedValueBoxMaxHeight}vh`}}
      >
        <DerivedFromRecipeViewOrPlaceholder {...{recipeBuilderState, derivedFromRecipeState}} />
      </div>
      <Spacer/>
    </div>
  )
});

export const Preview_DerivationView = () => (
  <DerivationView diceKey={DiceKey.testExample} />
)
