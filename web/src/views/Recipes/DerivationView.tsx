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



// Need back button in wizard for raw domain and purpose
// Center the controls for the derived values
// 
// Add save feature
// Remove +- from editor if field editor showing
// Raw JSON will need name to save
// Remove RecipeBuilderView from Security Key seeding
//
// convert manual styling to css?

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
    <div style={{
      width: `80vw`,
      height: `100%`,
      justifySelf: "stretch",
      alignSelf: "stretch",
      display: "flex", flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "yellow",
      paddingLeft: `10vw`, paddingRight: `10vw`,
    }}>
      <div style={{
        marginLeft: `10vw`, marginRight: `10vw`,
        display: "flex", flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "yellow",
      }}>
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
        <div style={{
          display: "flex", flexDirection: "row",
          marginTop: `1rem`,
          alignItems: "flex-start",
        }}>
          <button onClick={state.abortEnteringRawJson}>Go back</button>
          <button style={{
              marginLeft: `2rem`, alignSelf: "flex-end"
            }} onClick={state.dismissRawJsonWarning}>I accept the risk</button>
        </div>
      </div>
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
