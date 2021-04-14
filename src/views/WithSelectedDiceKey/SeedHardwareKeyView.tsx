import React from "react";
import { action, makeAutoObservable } from "mobx";
import { observer  } from "mobx-react";
//import { DiceKey, addSequenceNumberToRecipeJson } from "../../dicekeys";
import { DiceKey } from "../../dicekeys/DiceKey";
import { addSequenceNumberToRecipeJson } from "../../dicekeys/DerivationRecipe";
import { SequenceNumberFormFieldView } from "../Recipes/SequenceNumberView";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { uint8ArrayToHexString } from "../../utilities/convert";
import { GlobalSharedToggleState, GeneratedTextFieldViewWithSharedToggleState, GeneratedTextFieldView } from "../basics/GeneratedTextField";
import { Layout, Text } from "../../css";
import { AsyncResultObservable } from "~api-handler/AsyncResultObservable";


const seedSecurityKeyRecipeTemplate = `{"purpose":"seedSecurityKey"}`;


export class SeedHardwareKeyViewState {
  readonly seedString: string;
  sequenceNumber?: number;
  setSequenceNumber = action( (newSequenceNumber: number | undefined) => {
    this.sequenceNumber = newSequenceNumber;
  });

  get recipe(): string {
    return addSequenceNumberToRecipeJson(seedSecurityKeyRecipeTemplate, this.sequenceNumber);
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

const GeneratedSecurityKeySeedView = GeneratedTextFieldViewWithSharedToggleState(new GlobalSharedToggleState("SecurityKeyField", true));

export const SeedHardwareKeyView = observer( ( props: SeedHardwareKeyViewProps) => {
  return (
    <div className={Layout.MarginsAroundForm} >
      <div className={Layout.LeftJustifiedColumn}>
        <h2>Recipe Constructor</h2>
        <SequenceNumberFormFieldView sequenceNumberState={props.seedHardwareKeyViewState} />
        <h2>Recipe</h2>
        <GeneratedTextFieldView value={ props.seedHardwareKeyViewState.recipe } showCopyIcon={true} />
        <h2>Seed to Write Into Security Key</h2>
        <GeneratedSecurityKeySeedView value={props.seedHardwareKeyViewState.hexSeed ?? "" } />
        <div className={Text.Regrets} style={{marginTop: "2rem"}}>
          <div>Your browser prohibits this app from writing to USB devices.</div>
          <div>To seed a security key, you will need to use Android app or desktop app.</div>
        </div>
      </div>
    </div>
  );
});


export const Preview_SeedHardwareKeyView = () => {
  const diceKey = DiceKey.testExample;
  const seedHardwareKeyViewState = new SeedHardwareKeyViewState(DiceKey.toSeedString(diceKey, true));
  return (
    <SeedHardwareKeyView {...{diceKey, seedHardwareKeyViewState}} />
  )
}