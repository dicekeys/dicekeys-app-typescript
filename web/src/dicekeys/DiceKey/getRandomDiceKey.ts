import { Clockwise90DegreeRotationsFromUpright } from "@dicekeys/read-dicekey-js";
import { getRandomUInt32 } from "../../utilities/get-random-bytes";
import {
  Face,
  FaceDigit, FaceLetter, FaceLetters, FaceOrientationLettersTrbl
} from "./Face";
import { DiceKeyFaces, NumberOfFacesInKey } from "./KeyGeometry";

export const getRandomDiceKey = (numberOfFacesPerDie: number = 6): DiceKeyFaces => {
  const remainingLetters = [...FaceLetters];
  return DiceKeyFaces(
    Array.from({ length: NumberOfFacesInKey }, (): Face => {
      // Pull out a letter at random from the remainingLetters array
      const letterIndex = getRandomUInt32() % remainingLetters.length;
      const letter = remainingLetters.splice(letterIndex, 1)[0] as FaceLetter;
      // Generate a digit at random
      const digit = ((getRandomUInt32() % numberOfFacesPerDie) + 1).toString() as FaceDigit;
      const clockwiseOrientationsFromUpright = getRandomUInt32() % 4;
      const orientationAsLowercaseLetterTrbl = FaceOrientationLettersTrbl[Clockwise90DegreeRotationsFromUpright(clockwiseOrientationsFromUpright % 4)];
      const faceAndOrientation: Face = {
        digit, letter, orientationAsLowercaseLetterTrbl
      };
      return faceAndOrientation;
    }));
};
