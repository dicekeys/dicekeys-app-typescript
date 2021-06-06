import css from "./Recipes.module.css";
import React, { useEffect, useState } from "react";
import { observer  } from "mobx-react";
import { ContentBox, Spacer } from "../basics";
import { RecipeFieldsHelpView, RecipeBuilderFieldsView, RecipeRawJsonView } from "./RecipeBuilderView"
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";

const seedSecurityKeyPurpose = "seedSecurityKey";




import {IElectronBridge, Device} from "../../../../common/IElectronBridge";
export const HardwareSecurityKeysView = observer ( ({ElectronBridge}: {ElectronBridge: IElectronBridge}) => {
  const [devices, setDevices] = useState<Device[]>();
  const [error, setError] = useState<any>();
  // Note, listenForSeedableSecurityKeys returns a cleanup function, which useEffect will call on destructuring.
  // Do not revise below code without guaranteeing the returned cleanup function gets called.
  useEffect( () => ElectronBridge.listenForSeedableSecurityKeys(setDevices, setError) );
  return (<div className={css.SeedingContentBlock}>
    Electron: {JSON.stringify(ElectronBridge)}
    <br/>
    Devices: {JSON.stringify(devices)}
    <br/>
    Error: {JSON.stringify(error)}
  </div>);
});



export const CannotSeedSecurityKeysView = () => (
  <div className={css.CannotSeedContentBlock}>
    Web browsers currently prevent web-based applications from using USB to seed hardware security keys.
    <br/>
    To seed a security key, you'll need to use the DiceKeys app on Android, Windows, Linux, or MacOS.
  </div>
)


export const SeedHardwareKeyViewWithState = observer( ( {recipeBuilderState, derivedFromRecipeState}: {
  recipeBuilderState: RecipeBuilderState
  derivedFromRecipeState: DerivedFromRecipeState
}) => {
  const {ElectronBridge} = window as {ElectronBridge?: IElectronBridge}
  return (
    <ContentBox>
      <Spacer/>
      <div className={css.DerivationView}>
        <div className={css.RecipeFormFrame}>
          <RecipeFieldsHelpView state={recipeBuilderState} />
          <RecipeBuilderFieldsView state={recipeBuilderState} />
          <RecipeRawJsonView state={recipeBuilderState} /> 
        </div>
        <DerivedFromRecipeView state={derivedFromRecipeState} />
        {/* <Spacer/> */}
        { ElectronBridge != null ? (
          <HardwareSecurityKeysView {...{ElectronBridge}}/>
        ) : (
          <CannotSeedSecurityKeysView/>
        )}
      </div>
      <Spacer/>
    </ContentBox>
  )
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
    <SeedHardwareKeyViewWithState {...{recipeBuilderState, derivedFromRecipeState}}/>
  )
});

