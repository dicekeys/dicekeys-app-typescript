import {
  Recipe
} from "@dicekeys/dicekeys-api-js";
import {
  ProofOfPriorDerivationModule
} from "../api-handler/mutate-recipe";
import {
  jsonStringifyWithSortedFieldOrder
} from "../api-handler/json"

const seedString = "Put this in water and an avocado will grow.";

const someRecipe = Recipe({
  type: "Secret",
  lengthInBytes: 128
}, {
  someExtraSalt: "totally"
});

describe ("Recipe ", () => {

  test ("Should verify if unchanged", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withProof = proofOfDerivation.addToRecipeJson(seedString, someRecipe);
    expect(proofOfDerivation.verify(seedString, withProof)).toBe(true);
  });

  test ("Should fail if no proof", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withoutProof = jsonStringifyWithSortedFieldOrder(someRecipe);
    expect(proofOfDerivation.verify(seedString, withoutProof)).toBe(false);
  });

  test ("Should fail if json changed", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withProof = proofOfDerivation.addToRecipeJson(seedString, someRecipe);
    const modified = withProof.replace("totally", "partially");
    expect(proofOfDerivation.verify(seedString, modified)).toBe(false);
  });
  
  test ("Should fail if proof changed", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withProof = proofOfDerivation.addToRecipeJson(seedString, someRecipe);
    const withProofObj =JSON.parse(withProof) as Recipe;
    // Move first five characters to the end.
    withProofObj.proofOfPriorDerivation =
      withProofObj.proofOfPriorDerivation!.substr(5) + withProofObj.proofOfPriorDerivation!.substr(0,5);
    const modified = jsonStringifyWithSortedFieldOrder(withProofObj);
    expect(proofOfDerivation.verify(seedString, modified)).toBe(false);
  });

});