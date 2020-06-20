import {
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  addProofOfPriorDerivation,
  verifyProofOfPriorDerivation
} from "../api-handler/mutate-derivation-options";
import {
  jsonStringifyWithSortedFieldOrder
} from "../api-handler/json"

const seedString = "Put this in water and an avocado will grow.";

const someDerivationOptions = DerivationOptions({
  mutable: true,
  type: "Secret",
  lengthInBytes: 128,
  someExtraSalt: "totally"
});

describe ("Derivation options ", () => {

  test ("Should verify if unchanged", async () => {
    const withProof = await addProofOfPriorDerivation(seedString, someDerivationOptions);
    const withProofAsObject = JSON.parse(withProof) as DerivationOptions;
    expect (typeof withProofAsObject.mutable).toBe("undefined");
    expect(await verifyProofOfPriorDerivation(seedString, withProof)).toBe(true);
  });

  test ("Should fail if no proof", async () => {
    const withoutProof = jsonStringifyWithSortedFieldOrder(someDerivationOptions);
    expect(await verifyProofOfPriorDerivation(seedString, withoutProof)).toBe(false);
  });

  test ("Should fail if json changed", async () => {
    const withProof = await addProofOfPriorDerivation(seedString, someDerivationOptions);
    const modified = withProof.replace("totally", "partially");
    expect(await verifyProofOfPriorDerivation(seedString, modified)).toBe(false);
  });
  
  test ("Should fail if proof changed", async () => {
    const withProof = await addProofOfPriorDerivation(seedString, someDerivationOptions);
    const withProofObj =JSON.parse(withProof) as DerivationOptions;
    // Move first five characters to the end.
    withProofObj.proofOfPriorDerivation =
      withProofObj.proofOfPriorDerivation!.substr(5) + withProofObj.proofOfPriorDerivation!.substr(0,5);
    const modified = jsonStringifyWithSortedFieldOrder(withProofObj);
    expect(await verifyProofOfPriorDerivation(seedString, modified)).toBe(false);
  });

});