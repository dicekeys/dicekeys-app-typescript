import React from "react";
import { Observer  } from "mobx-react";
import { RecipeBuilderState, RecipeEditingMode } from "./RecipeBuilderState";
import { DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";
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
import { observer } from "mobx-react-lite";
import { DiceKeyState } from "../../state/Window/DiceKeyState";


export const RecipeWizardOrFieldsView = observer ( ({recipeBuilderState}: {
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


export const DerivationView = ({diceKeyState}: {
  diceKeyState: DiceKeyState;
}) => {
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, diceKeyState});
  const {diceKey} = diceKeyState;
  if (diceKey == null) return null;

  return (
    <Observer>{ () => (
      <DerivationViewContainer>
        <RawJsonWarning state={recipeBuilderState} />
        <RecipeWizardOrFieldsView {...{recipeBuilderState}} />
        <KeyPlusRecipeView {...{diceKey, recipeBuilderState}} />
        <DerivedContentContainer>
          <DerivedFromRecipeView allowUserToChangeOutputType={true} {...{state: derivedFromRecipeState}} />
        </DerivedContentContainer>
      </DerivationViewContainer>
    )}
    </Observer>
  );
}

export const Preview_DerivationView = () => (
  <DerivationView diceKeyState={new DiceKeyState(DiceKeyWithoutKeyId.testExample)} />
)
