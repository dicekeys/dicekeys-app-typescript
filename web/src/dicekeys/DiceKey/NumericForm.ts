import { Clockwise90DegreeRotationsFromUpright } from "./KeyGeometry";
import {
  FaceDigit,
  FaceDigits,
  FaceLetter, FaceLetters,
  FaceOrientationLetterTrbl,
  FaceOrientationLettersTrbl,
  Number0To24
} from "./Face";
import { DiceKeyFaces } from "./KeyGeometry";
import { rangeStartingAt0 } from "../../utilities/range";

const range0to23 = rangeStartingAt0(24);
const range0to24 = rangeStartingAt0(25) as Number0To24[];

export const factorialConstants0to25: bigint[] = Array.from(Array(26).keys()).reduce((factorials) => {
  if (factorials.length === 0) factorials.push(BigInt(0));
  else if (factorials.length === 1) factorials.push(BigInt(1));
  else factorials.push(factorials[factorials.length - 1]! * BigInt(factorials.length));
  return factorials;
}, [] as bigint[]);
const uniqueLetterEncodingSize = factorialConstants0to25[25]!;
export const digitEncodingSize = BigInt(6) ** BigInt(24);
export const uniqueOrientationEncodingSize = BigInt(4) ** BigInt(24);
export const SizeOfNumericEncodingForUniqueLetters = uniqueLetterEncodingSize * digitEncodingSize * uniqueOrientationEncodingSize;
export const facesFromNumericForm = (numericForm: bigint): DiceKeyFaces => {
  const orientationsAsBigInt = numericForm % uniqueOrientationEncodingSize;
  const withoutOrientations = numericForm / uniqueOrientationEncodingSize;
  const digitsAsBigInt = withoutOrientations % digitEncodingSize;
  const withoutDigits = withoutOrientations / digitEncodingSize;
  const lettersAsBigInt = withoutDigits % uniqueLetterEncodingSize;

  const { orientations } = range0to23.reduce((r, _, index) => {
    // Build right to left by reading the number from its least significant 2 bits to most-significant two bits
    // and appending orientations onto the start of the array.
    let { orientationsAsBigInt } = r;
    const { orientations } = r;
    if (index == 12) {
      // the center face is always upright, so index 12 actually refers to the 13th face.
      r.orientations.unshift("t");
    }
    orientations.unshift(FaceOrientationLettersTrbl[Number(orientationsAsBigInt % 4n) as Clockwise90DegreeRotationsFromUpright]);
    orientationsAsBigInt /= 4n;
    return { orientations, orientationsAsBigInt };
  }, { orientations: [] as FaceOrientationLetterTrbl[], orientationsAsBigInt });

  const { digits } = range0to24.reduce((r) => {
    // Build right to left by reading the number 0-5 from digitsAsBigInt % 6, then dividing by 6
    // for the next most significant value (the digit to the left) 
    let { digitsAsBigInt } = r;
    const { digits } = r;
    digits.unshift(FaceDigits[Number(digitsAsBigInt % 6n) as Clockwise90DegreeRotationsFromUpright]);
    digitsAsBigInt /= 6n;
    return { digits, digitsAsBigInt };
  }, { digits: [] as FaceDigit[], digitsAsBigInt });

  const { letterIndexes } = range0to24.reduce((r, _, index) => {
    // Build right to left by reading the number 0-5 from digitsAsBigInt % 6, then dividing by 6
    // for the next most significant value (the digit to the left) 
    const { letterIndexes } = r;
    let { lettersAsBigInt } = r;
    letterIndexes.unshift(Number(lettersAsBigInt % BigInt(index + 1)));
    lettersAsBigInt /= BigInt(index + 1);
    return { letterIndexes, lettersAsBigInt };
  }, { letterIndexes: [] as number[], lettersAsBigInt });

  const { letters } = letterIndexes.reduce((r, letterIndex) => {
    const { letters, lettersRemaining } = r;
    letters.push(lettersRemaining[letterIndex]!);
    lettersRemaining.splice(letterIndex, 1);
    return { letters, lettersRemaining };
  }, { letters: [] as FaceLetter[], lettersRemaining: [...FaceLetters] });

  const faces = DiceKeyFaces(range0to24.map(index => ({
    letter: letters[index]!,
    digit: digits[index]!,
    orientationAsLowercaseLetterTrbl: orientations[index]!
  })));

  return faces;
};
