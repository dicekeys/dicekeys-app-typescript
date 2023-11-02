import { DiceKeyInHumanReadableForm, DiceKeyWithoutKeyId } from "../dicekeys/DiceKey";
import fs from "fs";
import { testDiceKeysInHumanReadableForm } from "./TestDiceKeysInHumanReadableForm";

export const createSetOfTestDiceKeys = (count: number) => {
  fs.writeFileSync('TestDiceKeysInHumanReadableForm.ts', `export const testDiceKeysInHumanReadableForm = ${
   JSON.stringify( 
      Array.from(Array(count).keys()).map( () => 
        DiceKeyWithoutKeyId.fromRandom().inHumanReadableForm
      ), undefined, 2)
    };` + "\n");
}

const isRunningInCI = false; // FIXME -- Need to fix this with a command-line option
export const TestDiceKeys = testDiceKeysInHumanReadableForm
  .slice(0, isRunningInCI ? undefined : 20 )
  .map(  (s) =>DiceKeyWithoutKeyId.fromHumanReadableForm(s as DiceKeyInHumanReadableForm) );