import { Clockwise90DegreeRotationsFromUpright } from "./KeyGeometry";
import { getRandomUInt32 } from "../../utilities/get-random-bytes";
import {
  OrientedFace,
  FaceDigit, FaceLetter, FaceLetters, FaceOrientationLettersTrbl
} from "./Face";
import { DiceKeyFaces, NumberOfFacesInKey } from "./KeyGeometry";

export const getRandomDiceKey = (numberOfFacesPerDie: number = 6): DiceKeyFaces => {
  const remainingLetters = [...FaceLetters];
  return DiceKeyFaces(
    Array.from({ length: NumberOfFacesInKey }, (): OrientedFace => {
      // Pull out a letter at random from the remainingLetters array
      const letterIndex = getRandomUInt32() % remainingLetters.length;
      const letter = remainingLetters.splice(letterIndex, 1)[0] as FaceLetter;
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
