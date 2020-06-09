import {
  Secret, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js"
import {
  secretTo10BitWords
} from "@dicekeys/dicekeys-api-js";


describe("Secret to words", () => {
  
  test("Handles too many words/bits needed", async () => {
    const secret = (await SeededCryptoModulePromise).Secret.deriveFromSeed(
      "Describing a female parent when speaking in the second person", `{ "lengthInBytes": 20 }`
    );
    const secretAs16Words = secretTo10BitWords(secret.secretBytes, {wordsNeeded: 16});
    expect(secretAs16Words.length).toBe(16)
    const secretWords1000WordsNeeded = secretTo10BitWords(secret.secretBytes, {wordsNeeded: 1000});
    expect(secretWords1000WordsNeeded).toStrictEqual(secretAs16Words);
    const secretWords2000BitsNeeded = secretTo10BitWords(secret.secretBytes, {bitsNeeded: 2000});
    expect(secretWords2000BitsNeeded).toStrictEqual(secretAs16Words);

    const secretAs5Words = secretTo10BitWords(secret.secretBytes, {wordsNeeded: 5});
    expect(secretAs5Words).toStrictEqual(secretAs16Words.slice(0, 5));
    const secretAs50Bits = secretTo10BitWords(secret.secretBytes, {bitsNeeded: 50});
    expect(secretAs50Bits).toStrictEqual(secretAs16Words.slice(0, 5));
    const secretAs41Bits = secretTo10BitWords(secret.secretBytes, {bitsNeeded: 41});
    expect(secretAs41Bits).toStrictEqual(secretAs16Words.slice(0, 5));
    const secretAs1Bits = secretTo10BitWords(secret.secretBytes, {bitsNeeded: 1});
    expect(secretAs1Bits).toStrictEqual(secretAs16Words.slice(0, 1));
    const secretAs0Bits = secretTo10BitWords(secret.secretBytes, {bitsNeeded: 0});
    expect(secretAs0Bits).toStrictEqual([]);
    const secretAs0Words = secretTo10BitWords(secret.secretBytes, {wordsNeeded: 0});
    expect(secretAs0Words).toStrictEqual([]);
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