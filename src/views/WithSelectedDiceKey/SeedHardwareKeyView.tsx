import React from "react";
import { makeAutoObservable } from "mobx";
import { observer  } from "mobx-react";
import { DiceKey } from "../../dicekeys/DiceKey";
import { addSequenceNumberToRecipeJson } from "../../dicekeys/ConstructRecipe";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { uint8ArrayToHexString } from "../../utilities/convert";
import { GeneratedTextFieldViewWithSharedToggleState, GeneratedTextFieldView, DiceKeyAsSeedView } from "../basics/GeneratedTextField";
import { Layout, Text } from "../../css";
import { AsyncResultObservable } from "../../utilities/AsyncResultObservable";
import { GlobalSharedToggleState } from "../../state";
import { NumberPlusMinusView, NumericTextFieldState } from "../../views/basics/NumericTextFieldView";
import { RecipeFieldView } from "../../views/Recipes/RecipeBuilderView";
import recipeCSS from "../Recipes/Recipes.module.css";

const seedSecurityKeyRecipeTemplate = `{"purpose":"seedSecurityKey"}`;


export class SeedHardwareKeyViewState {
  readonly seedString: string;
  sequenceNumberState = new NumericTextFieldState({minValue: 2});
  get sequenceNumber() { return this.sequenceNumberState.numericValue }


  get recipe(): string {
    return addSequenceNumberToRecipeJson(seedSecurityKeyRecipeTemplate, this.sequenceNumber)!;
  }

  get hexSeedAsyncResultObservable(): AsyncResultObservable<string> {    
    // must get recipe before going into the non-observed async function
    const recipe = this.recipe;
    return new AsyncResultObservable( (async (): Promise<string>  => {
      const seededCryptoModule = await SeededCryptoModulePromise;
      const secret = seededCryptoModule.Secret.deriveFromSeed(this.seedString, recipe);
      return uint8ArrayToHexString(secret.secretBytes);
    })() );
  }

  get hexSeed(): string | undefined {
    return this.hexSeedAsyncResultObservable.result;
  }

  constructor(seedString: string) {
    this.seedString = seedString;
    makeAutoObservable(this);
  }

}


interface SeedHardwareKeyViewProps {
  diceKey: DiceKey;
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}

const GeneratedSecurityKeySeedView = GeneratedTextFieldViewWithSharedToggleState({toggleState: new GlobalSharedToggleState.GlobalSharedToggleState("SecurityKeyField", true)});

export const SeedHardwareKeyView = observer( ( props: SeedHardwareKeyViewProps) => {
  return (
    <div className={Layout.MarginsAroundForm} >
      <div className={Layout.LeftJustifiedColumn}>
        <p>
          A <i>seed</i> secret used to grow other secrets.
          Combining a seed and a recipe always creates the same output, so as long as you keep a seed an a recipe around you can re-create the same output again.
          We use your DiceKey and a recipe to create a root key to store in your SoloKey or other hardware security key.
        </p>

        <h2>Recipe Options</h2>
        <RecipeFieldView
          label={"Sequence Number"}
          field="#"
//          description={`Change the sequence number to create a different seed.`}  
        >
          <NumberPlusMinusView textFieldClassName={recipeCSS.SequenceNumberTextField} state={props.seedHardwareKeyViewState.sequenceNumberState} />
        </RecipeFieldView>
        
        <h2>Recipe for Generating your Root Hardware Key</h2>
        <GeneratedTextFieldView value={ props.seedHardwareKeyViewState.recipe } />

        <h2>Seed</h2>
        <div>Your DiceKey represented in a text format:</div>
        <DiceKeyAsSeedView value={props.diceKey.toSeedString()} />

        <h2>Root Hardware Key Generated</h2>
        <GeneratedSecurityKeySeedView value={props.seedHardwareKeyViewState.hexSeed ?? "" } />
        <div className={Text.Regrets} style={{marginTop: "2rem"}}>
          <div>Your browser prohibits this app from writing to USB devices.</div>
          <div>To seed a security key, you will need to use the Android or desktop app.</div>
        </div>
      </div>
    </div>
  );
});


export const Preview_SeedHardwareKeyView = () => {
  const diceKey = DiceKey.testExample;
  const seedHardwareKeyViewState = new SeedHardwareKeyViewState(diceKey.toSeedString());
  return (
    <SeedHardwareKeyView {...{diceKey, seedHardwareKeyViewState}} />
  )
}