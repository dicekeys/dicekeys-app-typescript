import { Clockwise90DegreeRotationsFromUpright } from "./KeyGeometry";
import { getRandomUInt32 } from "../../utilities/get-random-bytes";
import {
  OrientedFace,
  FaceDigit, FaceLetter, FaceLetters, FaceOrientationLettersTrbl
} from "./Face";
import { DiceKeyFaces, NumberOfFacesInKey } from "./KeyGeometry";
import { rangeStartingAt0 } from "../../utilities/range";

export const getRandomDiceKey = (
  centerLetter: FaceLetter = FaceLetters[getRandomUInt32() % FaceLetters.length]!,
  numberOfFacesPerDie: number = 6
): DiceKeyFaces => {
  const remainingLetters = FaceLetters.filter( l => l !== centerLetter);
  return DiceKeyFaces(
    rangeStartingAt0(NumberOfFacesInKey).map( (index): OrientedFace => {
      // Pull out a letter at random from the remainingLetters array
      const letterIndex = getRandomUInt32() % remainingLetters.length;
      const letter = index === 12 ? centerLetter : remainingLetters.splice(letterIndex, 1)[0] as FaceLetter;
      // Generate a digit at random
      const digit = ((getRandomUInt32() % numberOfFacesPerDie) + 1).toString() as FaceDigit;
      const clockwiseOrientationsFromUpright = getRandomUInt32() % 4;
      const orientationAsLowercaseLetterTrbl = FaceOrientationLettersTrbl[Clockwise90DegreeRotationsFromUpright(clockwiseOrientationsFromUpright % 4)];
      const orientedFace: OrientedFace = {
        digit, letter, orientationAsLowercaseLetterTrbl
      };
      return orientedFace;
    }));
};
