import css from "../Recipes/Recipes.module.css";
import React, { useEffect, useState } from "react";
import { observer  } from "mobx-react";
import { ContentBox, Spacer } from "../basics";
import { RecipeFieldsHelpView, RecipeBuilderFieldsView, RecipeRawJsonView } from "../Recipes/RecipeBuilderView"
import { DerivedFromRecipeView } from "../Recipes/DerivedFromRecipeView";
import { RecipeBuilderState } from "../Recipes/RecipeBuilderState";
import { DerivedFromRecipeState } from "../Recipes/DerivedFromRecipeState";

const seedSecurityKeyPurpose = "seedSecurityKey";

// const GeneratedSecurityKeySeedView = GeneratedTextFieldViewWithSharedToggleState({toggleState: new GlobalSharedToggleState.GlobalSharedToggleState("SecurityKeyField", true)});

export const SeedHardwareKeyViewWithState = observer( ( {recipeBuilderState, derivedFromRecipeState}: {
  recipeBuilderState: RecipeBuilderState
  derivedFromRecipeState: DerivedFromRecipeState
}) => (
  <ContentBox>
    <Spacer/>
    <div className={css.DerivationView}>
      <div className={css.RecipeFormFrame}>
        <RecipeFieldsHelpView state={recipeBuilderState} />
        <RecipeBuilderFieldsView state={recipeBuilderState} />
        <RecipeRawJsonView state={recipeBuilderState} /> 
      </div>
      <DerivedFromRecipeView state={derivedFromRecipeState} />
    </div>
    <Spacer/>
  </ContentBox>
));

import {IElectronBridge, Device} from "../../IElectronBridge";
export const HardwareSecurityKeysView = observer ( () => {
  const {ElectronBridge} = window as {ElectronBridge?: IElectronBridge}
  const [devices, setDevices] = useState<Device[]>();
  const [error, setError] = useState<any>();
  useEffect( () => {
    if (ElectronBridge) {
      const cleanup = ElectronBridge.listenForSeedableSecurityKeys(setDevices, setError);
      return cleanup;
    }
    return;
  });
  return (<div>
    Electron: {JSON.stringify(ElectronBridge)}
    <br/>
    Devices: {JSON.stringify(devices)}
    <br/>
    Error: {JSON.stringify(error)}
  </div>);
});

export const SeedHardwareKeyView = observer ( (props: {seedString: string}) => {
  const recipeBuilderState =  new RecipeBuilderState({
    type: "Secret",
    purpose: seedSecurityKeyPurpose,
    editing: true,
    purposeFieldNonEditableByDefault: true, 
  });
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString: props.seedString});
  return (
    <>
    <SeedHardwareKeyViewWithState {...{recipeBuilderState, derivedFromRecipeState}}/>
    <HardwareSecurityKeysView/>
    </>
  )
});

