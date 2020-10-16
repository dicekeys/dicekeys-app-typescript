import {
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  ProofOfPriorDerivationModule
} from "../api-handler/mutate-derivation-options";
import {
  jsonStringifyWithSortedFieldOrder
} from "../api-handler/json"

const seedString = "Put this in water and an avocado will grow.";

const someDerivationOptions = DerivationOptions({
  type: "Secret",
  lengthInBytes: 128
}, {
  someExtraSalt: "totally"
});

describe ("Derivation options ", () => {

  test ("Should verify if unchanged", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withProof = proofOfDerivation.addToDerivationOptionsJson(seedString, someDerivationOptions);
    expect(proofOfDerivation.verify(seedString, withProof)).toBe(true);
  });

  test ("Should fail if no proof", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withoutProof = jsonStringifyWithSortedFieldOrder(someDerivationOptions);
    expect(proofOfDerivation.verify(seedString, withoutProof)).toBe(false);
  });

  test ("Should fail if json changed", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withProof = proofOfDerivation.addToDerivationOptionsJson(seedString, someDerivationOptions);
    const modified = withProof.replace("totally", "partially");
    expect(proofOfDerivation.verify(seedString, modified)).toBe(false);
  });
  
  test ("Should fail if proof changed", async () => {
    const proofOfDerivation = await ProofOfPriorDerivationModule.instancePromise;
    const withProof = proofOfDerivation.addToDerivationOptionsJson(seedString, someDerivationOptions);
    const withProofObj =JSON.parse(withProof) as DerivationOptions;
    // Move first five characters to the end.
    withProofObj.proofOfPriorDerivation =
      withProofObj.proofOfPriorDerivation!.substr(5) + withProofObj.proofOfPriorDerivation!.substr(0,5);
    const modified = jsonStringifyWithSortedFieldOrder(withProofObj);
    expect(proofOfDerivation.verify(seedString, modified)).toBe(false);
  });

});