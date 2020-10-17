import {
  ApiCalls,
  DerivationOptions,
  urlSafeBase64Encode,
} from "@dicekeys/dicekeys-api-js";
import {
  jsonStringifyWithSortedFieldOrder
} from "./json";
import {
   SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
import { getDefaultValueOfDerivationOptionsJsonMayBeModified } from "@dicekeys/dicekeys-api-js/dist/api-calls";

export const mayDerivationOptionsBeModified = (
  request: ApiCalls.Request
): boolean =>
  // If derivationOptionsJson is not set or set to an empty string, it may be modified
  !("derivationOptionsJson" in request) ||
  !request.derivationOptionsJson ||
  (
    // if the field is set, use the value of the field
    request.derivationOptionsJsonMayBeModified ??
    // If the field is not set, use the default for this command
    getDefaultValueOfDerivationOptionsJsonMayBeModified(request.command)
  );


  /**
 * Test if derivation options contain a `"proofOfPriorDerivation": "true"`indicating
 * that the derivationOptionsJson should be modified to contain such proof.
 * 
 * @param derivationOptionsOrJson 
 */
export const isProofOfPriorDerivationRequired = (
  derivationOptionsOrJson: DerivationOptions | string
): boolean =>
  DerivationOptions(derivationOptionsOrJson).proofOfPriorDerivation === ""


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
 * using these DerivationOptions before.
 * 
 * @param seedString 
 * @param derivationOptions 
 */
  protected generate = (
    seedString: string,
    derivationOptions: DerivationOptions
  ): string => {
    const copyOfDerivationOptions = {...derivationOptions};
    copyOfDerivationOptions.proofOfPriorDerivation = "";
    const derivationOptionsJsonToAddProofTo = jsonStringifyWithSortedFieldOrder(copyOfDerivationOptions);
    const firstHash = this.seededCryptoModule.DerivationOptions.derivePrimarySecret(
      seedString,
      derivationOptionsJsonToAddProofTo
    );
    const secondHash = this.seededCryptoModule.DerivationOptions.derivePrimarySecret(
      urlSafeBase64Encode(firstHash),
      derivationOptionsJsonToAddProofTo
    );
    return urlSafeBase64Encode(secondHash);
  }

  /**
   * Augment the JSON DerivationOptions string with proof that the DiceKeys
   * app has derived a secret or key using these options before by setting the
   * `proofOfPriorDerivation` to a secret value which cannot be derived without
   * the seedString.
   * 
   * @param seedString The seed string used to derive a key or secret.
   * @param derivationOptionsOrJson Derivation options in either JSON format or
   * as JSON already parsed into a JavaScript object. 
   */
  addToDerivationOptionsJson = (
    seedString: string,
    derivationOptionsOrJson: DerivationOptions | string
  ): string => {
    // Once the proof is provided, the derivation options become immutable
    // since any change will invalidate the proof field.  So, remove any
    // [mutable] field from the [DerivationOptions]
    const derivationOptions =
      DerivationOptions(derivationOptionsOrJson);
    // Set the proofOfPriorDerivation to a MAC derived from the derivation options.
    return jsonStringifyWithSortedFieldOrder({
      ...derivationOptions,
      proofOfPriorDerivation: this.generate(seedString, derivationOptions)
    });
  }

  /**
   * Verify that a secret or key has previously been derived with the same
   * seedString and DerivationOptions by checking the [proofOfPriorDerivation]
   * field against a hash of the DerivationOptions and the SeedString.
   * 
   * @param seedString 
   * @param derivationOptionsOrJson 
   */
  verify = (
    seedString: string,
    derivationOptionsOrJson: DerivationOptions | string
  ): boolean => {
    const derivationOptions = DerivationOptions(derivationOptionsOrJson);
    const {proofOfPriorDerivation} = derivationOptions;

    if (proofOfPriorDerivation == null) {
      return false;
    }
    const reDerivedProofOfPriorDerivation =
      this.generate(seedString, derivationOptions);

    return proofOfPriorDerivation === reDerivedProofOfPriorDerivation;
  }


}
