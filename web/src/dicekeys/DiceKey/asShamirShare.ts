import { PointInIntegerSpace } from "../../utilities/ShamirSecretSharing";
import {
  OrientedFace, uniqueFaceLettersToBigInt,
  FaceLetter,
  faceDigitsToBigInt, faceOrientationTrblToBigInt, bigIntForAllDigitsToFaceDigits, bigIntForAllOrientationsToFaceOrientations, bigIntToUniqueFaceLetters, faceLetterToNumber0to24, number0to24ToFaceLetter, Number0To24
} from "./Face";
import { DiceKeyFaces } from "./KeyGeometry";
import { rotateToTurnCenterFaceUpright } from "./Rotation";

export type DiceKeyInFiniteFieldPointFormat = PointInIntegerSpace<bigint>;

// With DiceKey rotated with center face upright,
// High order to low order from top left, top second left, ..., bottom second from right, bottom right

const factorial = (n: number): bigint => n <= 1 ? 1n : BigInt(n) * factorial(n-1);

/**
 * Space for 24 orientations from 0 to (4^24)-1 (center die is always upright so not stored)
 */
export const multiplyOrientationsBy = 1n;
export const orientationsEndAt =  4n**24n;
/**
 * Digit space from (4^24) to (4^24)*(6^25)-1
 */
export const digitsEndAt = orientationsEndAt * (6n**25n);
export const digitsStartAt = orientationsEndAt;

/**
 * Digit space from (4^24)*(6^25) to (4^24)*(6^25)(24!) = 4965085386487195648093164022874392260102656274632540160000n
 */
export const lettersEndAt = digitsEndAt * factorial(24);
export const lettersStartAt = digitsEndAt;
export const EncodingSpaceOfDiceKeyInFiniteFieldPointFormatYEncodingSpace = 4965085386487195648093164022874392260102656274632540160000n;
if (lettersEndAt != EncodingSpaceOfDiceKeyInFiniteFieldPointFormatYEncodingSpace) {
  throw new Error("Assertion failed for encoding DiceKeys");
}

export const areItemsUnique = <T>(items: T[]) => items.length === new Set(items).size;
export const areFacesLettersUnique = (faces: DiceKeyFaces) => areItemsUnique(faces.map( f => f.letter ));

export const facesToShamirShareFiniteFieldPoint = (faces: DiceKeyFaces): DiceKeyInFiniteFieldPointFormat => {
  if (!areFacesLettersUnique(faces)) {
    throw new RangeError(`DiceKey must have 25 unique letters to be converted to a shamir share`);
  }
  const facesCenterUpright = rotateToTurnCenterFaceUpright(faces) as readonly OrientedFace[];
  const all25Digits = facesCenterUpright.map( f => f.digit );
  const centerFaceLetter = facesCenterUpright[12]?.letter;
  const facesExceptCenter = [...facesCenterUpright.slice(0,12), ...facesCenterUpright.slice(13)];
  if (centerFaceLetter == null || facesExceptCenter.length != 24) {
    throw new RangeError(`DiceKey must have 25 faces`);
  }
  const remaining24Letters = facesExceptCenter.map( f => f.letter);
  const remaining24Orientations = facesExceptCenter.map( f => f.orientationAsLowercaseLetterTrbl );
  const x = BigInt(faceLetterToNumber0to24(centerFaceLetter));
  const yLetters = lettersStartAt * uniqueFaceLettersToBigInt(remaining24Letters, new Set<FaceLetter>([centerFaceLetter]));
  const yDigits = digitsStartAt * faceDigitsToBigInt( all25Digits );
  const yOrientations = multiplyOrientationsBy * faceOrientationTrblToBigInt( remaining24Orientations );
  const asBigInt: bigint = yLetters + yDigits + yOrientations;
  const y = asBigInt + 1n;
  return {x, y};
}

export const shamirShareFiniteFieldPointToFaces = (share: DiceKeyInFiniteFieldPointFormat) => {
  const {x, y: asBigIntPlus1} = share;
  const asBigInt = asBigIntPlus1 - 1n;
  const centerFaceLetter = number0to24ToFaceLetter(Number(x) % 25 as Number0To24);

  const yLetters = (asBigInt % lettersEndAt) / lettersStartAt;
  const yDigits = (asBigInt % digitsEndAt) / digitsStartAt;
  const yOrientations = (asBigInt % orientationsEndAt) / multiplyOrientationsBy;
  const letters24 = bigIntToUniqueFaceLetters(yLetters, new Set([centerFaceLetter]));
  const digits25 = bigIntForAllDigitsToFaceDigits(yDigits, 25);
  const digits24 = [...digits25.slice(0,12), ...digits25.slice(13)];
  const centerFaceDigit = digits25[12]!;
  const orientations24 = bigIntForAllOrientationsToFaceOrientations(yOrientations, 24);
  const faces24: OrientedFace[] = [...Array(24).keys()].map( (_, i) => ({
    letter: letters24[i]!,
    digit: digits24[i]!,
    orientationAsLowercaseLetterTrbl: orientations24[i]!
  } satisfies OrientedFace) );

  const centerFace: OrientedFace = {
    digit: centerFaceDigit,
    letter: centerFaceLetter,
    orientationAsLowercaseLetterTrbl: 't'
  };

  return DiceKeyFaces([...faces24.slice(0,12), centerFace, ...faces24.slice(12)], true);
}

