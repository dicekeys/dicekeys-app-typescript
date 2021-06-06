import css from "./Recipes.module.css";
import React, { useEffect } from "react";
import { observer  } from "mobx-react";
import { ContentBox, Spacer } from "../basics";
import { RecipeFieldsHelpView, RecipeBuilderFieldsView, RecipeRawJsonView } from "./RecipeBuilderView"
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";

const seedSecurityKeyPurpose = "seedSecurityKey";


import {IElectronBridge, Device} from "../../../../common/IElectronBridge";
import { action, makeAutoObservable } from "mobx";


class SeedableDiceKeys {
  destructor?: () => void;
  devices?: Device[] = undefined;
  setDevices = action ((devices: Device[]) => {
    this.devices = devices;
  });
  error?: any;
  setError = action ((error: any) => {
    this.error = error;
  });

  constructor() {
    const {ElectronBridge} = window as {ElectronBridge?: IElectronBridge}
    this.destructor = ElectronBridge?.listenForSeedableSecurityKeys( this.setDevices, this.setError );
    makeAutoObservable(this);
  }

  destroy() {
    this.destructor?.();
  }
}

export const HardwareSecurityKeysView = observer ( ({seedableDiceKeys}: {seedableDiceKeys?: SeedableDiceKeys}) => (
<div className={css.SeedingContentBlock}>
    Devices: {JSON.stringify(seedableDiceKeys?.devices)}
    <br/>
    Error: {JSON.stringify(seedableDiceKeys?.error)}
  </div>
));

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
  const {ElectronBridge} = window as {ElectronBridge?: IElectronBridge};
  const seedableDiceKeys = new SeedableDiceKeys();
  useEffect( () => () => seedableDiceKeys.destroy() );
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
          <HardwareSecurityKeysView {...{seedableDiceKeys}}/>
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

