import {Words_5_1024} from "./words-5-1024";

const secretToWords: (
  wordListOfLengthPowerOf2: string[]
) =>
  (
    secret: Uint8Array,
    options?: {
      wordsNeeded?: number,
      bitsNeeded?: number
    }
  ) => string[] =
  (wordListOfLengthPowerOf2) => {
    const bitsPerWord = Math.round(Math.log2(wordListOfLengthPowerOf2.length));
    return (secret, options = {}) => {
      var {wordsNeeded, bitsNeeded} = options;
      if (typeof wordsNeeded === "number" && typeof bitsNeeded !== "number") {
        bitsNeeded = wordsNeeded * bitsPerWord
      }
      const secretRemaining = [...secret];
      var byte: number = 0;
      var bitsLeftInByte = 0;
      var wordIndex = 0;
      var bitsNeededForWordIndex = bitsPerWord;
      var bitsAllInWordsGeneratedSoFar = 0;
      const wordsGenerated: string[] = [];
      while (typeof bitsNeeded !== "number" || bitsAllInWordsGeneratedSoFar < bitsNeeded) {
        // We still need more words
        if (bitsLeftInByte === 0) {
          if (secretRemaining.length > 0) {
            byte = secretRemaining.shift()!;
            bitsLeftInByte = 8;
          } else {
            // We're out of bits.
            if (bitsNeededForWordIndex < bitsPerWord) {
              wordsGenerated.push(wordListOfLengthPowerOf2[wordIndex]);
            }
            return wordsGenerated;
          }
        }
        const bitsToCopy = Math.min(bitsLeftInByte, bitsNeededForWordIndex);
        wordIndex = 
          (wordIndex << bitsToCopy) +
          (byte >> (bitsLeftInByte - bitsToCopy));
        bitsNeededForWordIndex -= bitsToCopy;
        bitsLeftInByte -= bitsToCopy;
        byte = byte & (0xff >> (8-bitsLeftInByte));
        if (bitsNeededForWordIndex === 0) {
          wordsGenerated.push(wordListOfLengthPowerOf2[wordIndex]);
          wordIndex = 0;
          bitsNeededForWordIndex = bitsPerWord;
          bitsAllInWordsGeneratedSoFar += bitsPerWord;
        }

      }
      return wordsGenerated;
    }
  }

export const secretTo10BitWords = secretToWords(Words_5_1024);