import { getRandomUInt32 } from "../../utilities/get-random-bytes";
import { PointInIntegerSpace } from "../../utilities/ShamirSecretSharing";
import {
  Face,
  OrientedFace,
  faceLetterAndDigitToNumber0to149, number0to149ToFaceLetterAndDigit,
  NumberOfPossibleFaces,
  uniqueFaceLettersToBigInt,
  FaceLetter,
  faceDigitsToBigInt, faceOrientationTrblToBigInt, bigIntForAllDigitsToFaceDigits, bigIntForAllOrientationsToFaceOrientations, bigIntToUniqueFaceLetters
} from "./Face";
import { DiceKeyFaces } from "./KeyGeometry";
import { rotateToTurnCenterFaceUpright } from "./Rotation";

export type ShamirShareAsFiniteFieldPoint = PointInIntegerSpace<bigint>;

export const getUnusedFaceIndexes = (usedFaceIndexes: number[]): number[] => {
  const usedFaceIndexesSet = new Set(usedFaceIndexes);
  return [...(Array(NumberOfPossibleFaces).keys())].filter( i => !usedFaceIndexesSet.has(i) );
}

export const getRandomUnusedFace = (faces: Face[]) => {
  const faceIndexes = getUnusedFaceIndexes( faces.map( faceLetterAndDigitToNumber0to149 ) );
  const randomFaceIndex = faceIndexes[getRandomUInt32() % faceIndexes.length]!;
  return number0to149ToFaceLetterAndDigit( randomFaceIndex )
}

const orientationsStartAt = 1n;
const orientationsEndAt =  4n**24n * orientationsStartAt;
const digitsStartAt = orientationsEndAt;
const digitsEndAt = digitsStartAt * (6n**24n);;
const lettersStartAt = digitsEndAt;
const factorial = (n: number): bigint => n <= 1 ? 1n : BigInt(n) * factorial(n-1)
const lettersEndAt = lettersStartAt * factorial(24);

export const facesToShamirShareFiniteFieldPoint = (faces: DiceKeyFaces): ShamirShareAsFiniteFieldPoint => {
  const facesCenterUpright = rotateToTurnCenterFaceUpright(faces) as readonly OrientedFace[];
  // remove center die
  const [centerDie] = (facesCenterUpright as OrientedFace[]).splice(12, 1);
  if (centerDie == null || facesCenterUpright.length != 24) {
    throw new RangeError(`DiceKey must have 25 faces`);
  }
  const x = BigInt(faceLetterAndDigitToNumber0to149(centerDie));
  const yLetters = lettersStartAt *
    uniqueFaceLettersToBigInt(facesCenterUpright.map( f => f.letter), new Set<FaceLetter>([centerDie.letter]));
  const yDigits = digitsStartAt *
    faceDigitsToBigInt( facesCenterUpright.map( f => f.digit ) );
  const yOrientations = orientationsStartAt *
      faceOrientationTrblToBigInt( facesCenterUpright.map( f => f.orientationAsLowercaseLetterTrbl ) );
  const y: bigint = yLetters + yDigits +  yOrientations;
  return {x, y};
}

export const shamirShareFiniteFieldPointToFaces = (share: ShamirShareAsFiniteFieldPoint) => {
  const {x, y} = share;

  const centerFace: OrientedFace = {
    ...number0to149ToFaceLetterAndDigit(Number(x)),
    orientationAsLowercaseLetterTrbl: 't'
  };

  const yLetters = (y % lettersEndAt) / lettersStartAt;
  const yDigits = (y % digitsEndAt) / digitsStartAt;
  const yOrientations = (y % orientationsEndAt) / orientationsStartAt;
  const letters = bigIntToUniqueFaceLetters(yLetters, new Set([centerFace.letter]));
  const digits = bigIntForAllDigitsToFaceDigits(yDigits, 24);
  const orientations = bigIntForAllOrientationsToFaceOrientations(yOrientations, 24);
  const faces24: OrientedFace[] = [...Array(24).keys()].map( (_, i) => ({
    letter: letters[i]!,
    digit: digits[i]!,
    orientationAsLowercaseLetterTrbl: orientations[i]!
  } satisfies OrientedFace) );

  return DiceKeyFaces([...faces24.slice(0,12), centerFace, ...faces24.slice(12)], true);
}
