import { uint8ClampedArrayToHexString } from "../../utilities/convert";
import { DiceKeyFaces } from "./KeyGeometry";
import { diceKeyFacesToSeedString } from ".";

/**
 * A DiceKey's keyId is the first 64 bits of the SHA256 hash of the DiceKey's seed string
 * in hex format
 * @param DiceKeyFaces
 * @returns 16 characters representing a 64 bit (8 byte) prefix of the 256 hash of the seed string.
 */
export const diceKeyFacesToKeyId = async (
  diceKeyFaces: DiceKeyFaces
): Promise<string> => {
  const keysSeedString = diceKeyFacesToSeedString(diceKeyFaces);
  const sha256HashOfSeed = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keysSeedString));
  const first64BitsOfHashAsByteArray = sha256HashOfSeed.slice(0, 8);
  const first64BitsOfHashAsHexString = uint8ClampedArrayToHexString(new Uint8ClampedArray(first64BitsOfHashAsByteArray));
  return first64BitsOfHashAsHexString;
};
