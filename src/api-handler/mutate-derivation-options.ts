import {
  ApiCalls,
  Recipe,
  urlSafeBase64Encode,
} from "@dicekeys/dicekeys-api-js";
import {
  jsonStringifyWithSortedFieldOrder
} from "./json";
import {
   SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
import { getDefaultValueOfRecipeMayBeModified } from "@dicekeys/dicekeys-api-js/dist/api-calls";

export const mayRecipeBeModified = (
  request: ApiCalls.Request
): boolean =>
  // If recipe is not set or set to an empty string, it may be modified
  !("recipe" in request) ||
  !request.recipe ||
  (
    // if the field is set, use the value of the field
    request.recipeMayBeModified ??
    // If the field is not set, use the default for this command
    getDefaultValueOfRecipeMayBeModified(request.command)
  );


  /**
 * Test if derivation options contain a `"proofOfPriorDerivation": "true"`indicating
 * that the recipe should be modified to contain such proof.
 * 
 * @param derivationOptionsOrJson 
 */
export const isProofOfPriorDerivationRequired = (
  derivationOptionsOrJson: Recipe | string
): boolean =>
  Recipe(derivationOptionsOrJson).proofOfPriorDerivation === ""


export class ProofOfPriorDerivationModule {
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers
  ) {}

  private static _instance?: ProofOfPriorDerivationModule;
  public static readonly instancePromise: Promise<ProofOfPriorDerivationModule> = (
    async () => {
      ProofOfPriorDerivationModule._instance = new ProofOfPriorDerivationModule(await SeededCryptoModulePromise);
      return ProofOfPriorDerivationModule._instance;
    }
  )();
  public static get instance() { return ProofOfPriorDerivationModule._instance; }

  /**
 * Generate a proof that this seed has been used to derive a key
 * using these Recipe before.
 * 
 * @param seedString 
 * @param derivationOptions 
 */
  protected generate = (
    seedString: string,
    derivationOptions: Recipe
  ): string => {
    const copyOfRecipe = {...derivationOptions};
    copyOfRecipe.proofOfPriorDerivation = "";
    const recipeToAddProofTo = jsonStringifyWithSortedFieldOrder(copyOfRecipe);
    const firstHash = this.seededCryptoModule.Recipe.derivePrimarySecret(
      seedString,
      recipeToAddProofTo
    );
    const secondHash = this.seededCryptoModule.Recipe.derivePrimarySecret(
      urlSafeBase64Encode(firstHash),
      recipeToAddProofTo
    );
    return urlSafeBase64Encode(secondHash);
  }

  /**
   * Augment the JSON Recipe string with proof that the DiceKeys
   * app has derived a secret or key using these options before by setting the
   * `proofOfPriorDerivation` to a secret value which cannot be derived without
   * the seedString.
   * 
   * @param seedString The seed string used to derive a key or secret.
   * @param derivationOptionsOrJson Derivation options in either JSON format or
   * as JSON already parsed into a JavaScript object. 
   */
  addToRecipeJson = (
    seedString: string,
    derivationOptionsOrJson: Recipe | string
  ): string => {
    // Once the proof is provided, the derivation options become immutable
    // since any change will invalidate the proof field.  So, remove any
    // [mutable] field from the [Recipe]
    const derivationOptions =
      Recipe(derivationOptionsOrJson);
    // Set the proofOfPriorDerivation to a MAC derived from the derivation options.
    return jsonStringifyWithSortedFieldOrder({
      ...derivationOptions,
      proofOfPriorDerivation: this.generate(seedString, derivationOptions)
    });
  }

  /**
   * Verify that a secret or key has previously been derived with the same
   * seedString and Recipe by checking the [proofOfPriorDerivation]
   * field against a hash of the Recipe and the SeedString.
   * 
   * @param seedString 
   * @param derivationOptionsOrJson 
   */
  verify = (
    seedString: string,
    derivationOptionsOrJson: Recipe | string
  ): boolean => {
    const derivationOptions = Recipe(derivationOptionsOrJson);
    const {proofOfPriorDerivation} = derivationOptions;

    if (proofOfPriorDerivation == null) {
      return false;
    }
    const reDerivedProofOfPriorDerivation =
      this.generate(seedString, derivationOptions);

    return proofOfPriorDerivation === reDerivedProofOfPriorDerivation;
  }


}
