import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, RecipeEditingMode } from "./RecipeBuilderState";
import { DiceKey, DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { RecipeWizardView } from "./DerivationView/RecipeWizardView";
import {KeyPlusRecipeView} from "./DerivationView/KeyPlusRecipeView";
import { RecipeFieldEditorView } from "./DerivationView/RecipeFieldEditorView";
import { SelectRecipeToLoadView } from "./LoadRecipeView";
import {
  DerivationViewContainer,
  DerivedContentContainer,
  RecipeWizardOrFieldsContainer
} from "./DerivationView/DerivationViewLayout";
import { RawJsonWarning } from "./DerivationView/RawJsonWarning";


export const RecipeWizardOrFieldsView = observer( ({recipeBuilderState}: {
  recipeBuilderState: RecipeBuilderState,
}) => (
  <RecipeWizardOrFieldsContainer>{
    recipeBuilderState.wizardComplete ? (
      recipeBuilderState.editingMode === RecipeEditingMode.NoEdit ?
        (<SelectRecipeToLoadView state={recipeBuilderState} defaultOptionLabel={"change recipe"} />) :
        (<RecipeFieldEditorView state={recipeBuilderState} />)
    ) : (
      <RecipeWizardView state={recipeBuilderState} />
    )
  }</RecipeWizardOrFieldsContainer>
));


export const DerivationView = ({diceKey}: {
  diceKey: DiceKey;
}) => {
  const seedString = diceKey.toSeedString();
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString});

  return (
    <DerivationViewContainer>
      <RawJsonWarning state={recipeBuilderState} />
      <RecipeWizardOrFieldsView {...{recipeBuilderState}} />
      <KeyPlusRecipeView {...{diceKey, recipeBuilderState}} />
      <DerivedContentContainer>
        <DerivedFromRecipeView {...{showPlaceholder: !recipeBuilderState.recipeIsNotEmpty, state: derivedFromRecipeState}} />
      </DerivedContentContainer>
    </DerivationViewContainer>
  );
}

export const Preview_DerivationView = () => (
  <DerivationView diceKey={DiceKeyWithoutKeyId.testExample} />
)
