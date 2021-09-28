import * as Dimensions from "./DerivationView/Dimensions";
import React from "react";
import { observer, Observer  } from "mobx-react";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { Spacer } from "../basics";
import { RecipeWizardView } from "./DerivationView/RecipeWizardView";
import {KeyPlusRecipeView} from "./DerivationView/KeyPlusRecipeView";
import { RecipeFieldEditorView } from "./DerivationView/RecipeFieldEditorView";


// Warning message display on raw json
// Need back button in wizard for raw domain and purpose
// Center the controls for the derived values
// 
// Add save feature
// Remove +- from editor if field editor showing
// Raw JSON will need name to save
// Remove RecipeBuilderView from Security Key seeding

export const RecipeWizardOrFieldsView = observer( ({recipeBuilderState}: {
  recipeBuilderState: RecipeBuilderState,
}) => recipeBuilderState.wizardComplete ? (
    <RecipeFieldEditorView state={recipeBuilderState} />
  ) : (
    <RecipeWizardView state={recipeBuilderState} />
    )
);

const ColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
}

const centeredColumnStyle: React.CSSProperties = {
  ...ColumnStyle,
  alignItems: "center",
}

const RawJsonWarning = observer ( ({state}: {
  state: RecipeBuilderState
}) => {
  return (
    <div>
      DANGER!
      <button onClick={state.abortEnteringRawJson}>Cancel</button>
      <button onClick={state.dismissRawJsonWarning}>I understand</button>
    </div>
  );
});

export const DerivationView = ( ({diceKey}: {
  diceKey: DiceKey;
}) => {
  const seedString = diceKey.toSeedString();
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString});

  // Renderer is wrapped in an observer so that it will update with recipeBuilderState
  return (<Observer>{ () => {
    if (recipeBuilderState.showRawJsonWarning) {
      return (
        <RawJsonWarning state={recipeBuilderState} />
      )
    }
    return (
      <div style={{
        // marginLeft: "5vw", marginRight: "5vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        justifySelf: "center",
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
          height: `${Dimensions.DerivedValueBoxMaxHeight}vh`,
          maxWidth: `${Dimensions.ScreenWidthPercentUsed}vw`
        }}
        >
          <DerivedFromRecipeView {...{showPlaceholder: !recipeBuilderState.recipeJson, state: derivedFromRecipeState}} />
        </div>
        <Spacer/>
      </div>
    )}}
  </Observer>);
});

export const Preview_DerivationView = () => (
  <DerivationView diceKey={DiceKey.testExample} />
)
