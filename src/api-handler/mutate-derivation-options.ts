import {
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  jsonStringifyWithSortedFieldOrder
} from "./json";
import {
  SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
import {
  urlSafeBase64Encode
} from "../api/encodings"

/**
 * Helper function to allow other functions to take a parameter that
 * is either a DerivationOptions object or a JSON string form of that
 * object and get back a DerivationOptions object.
 * @param derivationOptionsOrJson 
 */
const resolveDerivationOptions = (
  derivationOptionsOrJson: DerivationOptions | string
): DerivationOptions =>
  typeof derivationOptionsOrJson === "string" ?
    JSON.parse(derivationOptionsOrJson) as DerivationOptions :
    derivationOptionsOrJson;
  
/**
 * Test if derivation options contain a `"mutable": true` field indicating
 * that the API may return a different set of derivations than were passed to it,
 * adding such fields as [proofOfPriorDerivation].
 * 
 * @param derivationOptionsOrJson 
 */
export const areDerivationOptionsMutable = (
  derivationOptionsOrJson: DerivationOptions | string
): boolean =>
  !!resolveDerivationOptions(derivationOptionsOrJson).mutable

/**
 * Remove the mutable field from a DerivationOptions object.
 */
export const removeMutableFromDerivationOptions = (
  {mutable, ...immutableDerivationOptions}: DerivationOptions
): DerivationOptions => immutableDerivationOptions;


/**
 * Generate a proof that this seed has been used to derive a key
 * using these DerivationOptions before.
 * 
 * @param seedString 
 * @param derivationOptions 
 */
const generateProofOfPriorDerivation = async (
  seedString: string,
  derivationOptions: DerivationOptions
): Promise<string> => {
  const module = await SeededCryptoModulePromise;
  const copyOfDerivationOptions = {...derivationOptions};
  copyOfDerivationOptions.proofOfPriorDerivation = "";
  const derivationOptionsJsonToAddProofTo = jsonStringifyWithSortedFieldOrder(copyOfDerivationOptions);
  const firstHash = module.DerivationOptions.derivePrimarySecret(
    seedString,
    derivationOptionsJsonToAddProofTo
  );
  const secondHash = module.DerivationOptions.derivePrimarySecret(
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
export const addProofOfPriorDerivation = async (
  seedString: string,
  derivationOptionsOrJson: DerivationOptions | string
): Promise<string> => {
  // Once the proof is provided, the derivation options become immmutable
  // since any change will invalidate the proof field.  So, remove any
  // [mutable] field from the [DerivationOptions]
  const derivationOptions = removeMutableFromDerivationOptions(
    resolveDerivationOptions(derivationOptionsOrJson)
  );
  // Set the proofOfPriorDerivation to a MAC derived from the derivation options.
  derivationOptions.proofOfPriorDerivation = await generateProofOfPriorDerivation(seedString, derivationOptions);
  return jsonStringifyWithSortedFieldOrder(derivationOptions);
}

/**
 * Verify that a secret or key has previously been derived with the same
 * seedString and DerivationOptions by checking the [proofOfPriorDerivation]
 * field against a hash of the DerivationOptoins and the SeedString.
 * 
 * @param seedString 
 * @param derivationOptionsOrJson 
 */
export const verifyProofOfPriorDerivation = async (
  seedString: string,
  derivationOptionsOrJson: DerivationOptions | string
): Promise<boolean> => {
  const derivationOptions = resolveDerivationOptions(derivationOptionsOrJson);
  const {proofOfPriorDerivation} = derivationOptions;

  if (proofOfPriorDerivation == null) {
    return false;
  }
  const reDerivedProofOfPriorDerivation =
    await generateProofOfPriorDerivation(seedString, derivationOptions);

  return proofOfPriorDerivation === reDerivedProofOfPriorDerivation;
}

