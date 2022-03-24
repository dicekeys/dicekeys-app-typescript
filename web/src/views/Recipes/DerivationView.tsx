import React from "react";
import { RecipeBuilderState, RecipeEditingMode } from "./RecipeBuilderState";
import { DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
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
import { BaseViewState } from "../../state/core/ViewState";


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

export const SecretDerivationViewStateName = "secret";
export type SecretDerivationViewStateName = typeof SecretDerivationViewStateName;
export class SecretDerivationViewState extends BaseViewState<SecretDerivationViewStateName> {
  readonly recipeBuilderState: RecipeBuilderState;
  readonly derivedFromRecipeState: DerivedFromRecipeState; 
  constructor(public readonly diceKey: DiceKeyWithKeyId, basePath: string) {
    super(SecretDerivationViewStateName, basePath);
    this.recipeBuilderState = new RecipeBuilderState();
    this.derivedFromRecipeState = new DerivedFromRecipeState({recipeState: this.recipeBuilderState, diceKey});
  }
}

export const SecretDerivationView = observer ( ({state}: {state: SecretDerivationViewState}) => (
  <DerivationViewContainer>
    <RawJsonWarning state={state.recipeBuilderState} />
    <RecipeWizardOrFieldsView recipeBuilderState={state.recipeBuilderState} />
    <KeyPlusRecipeView diceKey={state.diceKey} recipeBuilderState={state.recipeBuilderState} />
    <DerivedContentContainer>
      <DerivedFromRecipeView allowUserToChangeOutputType={true} state={state.derivedFromRecipeState} />
    </DerivedContentContainer>
  </DerivationViewContainer>
));

export const Preview_DerivationView = () => (
  <SecretDerivationView state={new SecretDerivationViewState(DiceKeyWithKeyId.testExample, "")} />
)
