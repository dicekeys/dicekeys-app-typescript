import * as Dimensions from "./DerivationView/Dimensions";
import React from "react";
import { observer, Observer  } from "mobx-react";
import { RecipeBuilderState, RecipeEditingMode } from "./RecipeBuilderState";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { RecipeWizardView } from "./DerivationView/RecipeWizardView";
import {KeyPlusRecipeView} from "./DerivationView/KeyPlusRecipeView";
import { RecipeFieldEditorView } from "./DerivationView/RecipeFieldEditorView";
import { SelectRecipeToLoadView } from "./LoadRecipeView";
import styled from "styled-components";
import { ButtonRow, OptionButton } from "../../css/Button";
import { HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh } from "../../views/WithSelectedDiceKey/SelectedDiceKeyLayout";

export const RecipeWizardOrFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;  
  justify-content: center;
  align-content: flex-start;
  height: ${Dimensions.WizardOrFieldsMaxHeight}vh;
  width: ${Dimensions.ContentWidthInVw}vw;
`;

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

const WarningContainer = styled.div`
    width: 80vw;
    height: 100%;
    justify-self: stretch;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: yellow;
    padding-left: 10vw;
    padding-right: 10vw;
`;

const WarningDiv = styled.div``;

const RawJsonWarning = observer ( ({state}: {
  state: RecipeBuilderState
}) => {
  return (
    <WarningContainer>
      <WarningDiv>
        <div>
          <h3>
            Entering a recipe in raw JSON format can be dangerous.
          </h3>
          <li>
            If you enter a recipe provided by someone else, it could be a trick to get you to re-create a secret you use for another application or purpose.
          </li>
          <li>
            If you generate the recipe yourself and forget even a single character, you will be unable to re-generate the same secret again.
            (Saving the recipe won't help you if you lose the device(s) it's saved on.)
          </li>
        </div>
        <ButtonRow>
          <OptionButton onClick={state.abortEnteringRawJson}>Go back</OptionButton>
          <OptionButton onClick={state.dismissRawJsonWarning}>I accept the risk</OptionButton>
        </ButtonRow>
      </WarningDiv>
    </WarningContainer>
  );
});


const DerivationViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  justify-self: center;
  height: ${HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh}vh;
`;

const DerivedContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: ${Dimensions.DerivedValueBoxMaxHeight}vh;
  max-width: ${Dimensions.ContentWidthInVw}vw;
`;


export const DerivationView = ( ({diceKey}: {
  diceKey: DiceKey;
}) => {
  const seedString = diceKey.toSeedString();
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString});

  // Renderer is wrapped in an observer so that it will update with recipeBuilderState
  return (<Observer>{ () => {
    return recipeBuilderState.showRawJsonWarning ? (
      <RawJsonWarning state={recipeBuilderState} />
    ) : (
      <DerivationViewContainer>
        <RecipeWizardOrFieldsView {...{recipeBuilderState}} />
        <KeyPlusRecipeView {...{diceKey, recipeBuilderState}} />
        <DerivedContentContainer>
          <DerivedFromRecipeView {...{showPlaceholder: !recipeBuilderState.recipeIsNotEmpty, state: derivedFromRecipeState}} />
        </DerivedContentContainer>
      </DerivationViewContainer>
    )}}
  </Observer>);
});

export const Preview_DerivationView = () => (
  <DerivationView diceKey={DiceKey.testExample} />
)
