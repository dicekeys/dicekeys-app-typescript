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
import { observer } from "mobx-react";
import { ViewState } from "../../state/core/ViewState";
import { NavigationPathState } from "../../state/core/NavigationPathState";


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
export class SecretDerivationViewState implements ViewState<SecretDerivationViewStateName> {
  readonly viewName = SecretDerivationViewStateName;
  navState: NavigationPathState;
  readonly recipeBuilderState: RecipeBuilderState;
  readonly derivedFromRecipeState: DerivedFromRecipeState; 
  constructor(parentNavState: NavigationPathState, public readonly diceKey: DiceKeyWithKeyId) {
    this.navState = new NavigationPathState(parentNavState, SecretDerivationViewStateName);
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
  <SecretDerivationView state={new SecretDerivationViewState(NavigationPathState.root, DiceKeyWithKeyId.testExample)} />
)
