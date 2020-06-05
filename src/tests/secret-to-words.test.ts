import {
  Secret, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js"
import {
  secretTo10BitWords
} from "../api/secret-to-words";


describe("Secret to words", () => {
  
  test("Handles too many words/bits needed", async () => {
    const secret = (await SeededCryptoModulePromise).Secret.deriveFromSeed(
      "Describing a female parent when speaking in the second person", `{ "lengthInBytes": 20 }`
    );
    const secretWords1000WordsNeeded = secretTo10BitWords(secret.secretBytes, {wordsNeeded: 1000});
    expect(secretWords1000WordsNeeded.length).toBe(16)
    const secretWords2000BitsNeeded = secretTo10BitWords(secret.secretBytes, {bitsNeeded: 2000});
    expect(secretWords2000BitsNeeded.length).toBe(16)
  });

    
  test("Handles no options", async () => {
    const secret = (await SeededCryptoModulePromise).Secret.deriveFromSeed(
      "Describing a female parent when speaking in the second person", `{ "lengthInBytes": 20 }`
    );
    const secretWords = secretTo10BitWords(secret.secretBytes);
    expect(secretWords.length).toBe(16)
  });

      
  test("Handles option for four words", async () => {
    const secret = (await SeededCryptoModulePromise).Secret.deriveFromSeed(
      "Describing a female parent when speaking in the second person", `{ "lengthInBytes": 20 }`
    );
    const secretWords = secretTo10BitWords(secret.secretBytes, {wordsNeeded: 4});
    expect(secretWords.length).toBe(4);
  });

      
  test("Handles option for 57 bits (6 words)", async () => {
    const secret = (await SeededCryptoModulePromise).Secret.deriveFromSeed(
      "Describing a female parent when speaking in the second person", `{ "lengthInBytes": 20 }`
    );
    const secretWords = secretTo10BitWords(secret.secretBytes, {bitsNeeded: 57});
    expect(secretWords.length).toBe(6);
  });



});