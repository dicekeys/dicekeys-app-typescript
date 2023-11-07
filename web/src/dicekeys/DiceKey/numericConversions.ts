import { FaceIdentifiers } from "./Face";
import { Clockwise90DegreeRotationsFromUpright } from "./KeyGeometry";
import {
  Face,
  FaceDigit,
  FaceDigits,
  FaceLetter, FaceLetters,
  FaceOrientationLetterTrbl,
  FaceOrientationLettersTrbl
} from "./Face";


export type Number0To5 = 0 | 1 | 2 | 3 | 4 | 5;
export type Number0To24 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;

export const faceLetterToNumber0to24 = (faceLetter: FaceLetter) => FaceLetters.indexOf(faceLetter) as Number0To24;
export const number0to24ToFaceLetter = (number0to24: Number0To24) => FaceLetters[number0to24];

export const faceDigitToNumber0to5 = (faceDigit: FaceDigit) => FaceDigits.indexOf(faceDigit) as Number0To5;
export const number0to6ToFaceDigit = (number0to5: Number0To5) => FaceDigits[number0to5];

export const faceOrientationTrblToClockwise90RotationsFromUpright = (faceOrientationTrbl: FaceOrientationLetterTrbl) => FaceOrientationLettersTrbl.indexOf(faceOrientationTrbl) as Clockwise90DegreeRotationsFromUpright;
export const clockwise90DegreeRotationsToTrbl = (number0To3: Clockwise90DegreeRotationsFromUpright) => FaceOrientationLettersTrbl[number0To3];

export const faceLetterAndDigitToNumber0to149 = (face: FaceIdentifiers) => (faceLetterToNumber0to24(face.letter) * 6) + faceDigitToNumber0to5(face.digit);
export const number0to149ToFaceLetterAndDigit = (number0to149: number): FaceIdentifiers => ({
  digit: number0to6ToFaceDigit(number0to149 % 6 as Number0To5),
  letter: number0to24ToFaceLetter(Math.floor(number0to149 / 6) % 25 as Number0To24),
});

export const faceLetterDigitAndOrientationToNumber0to599 = (face: Face) => (faceOrientationTrblToClockwise90RotationsFromUpright(face.orientationAsLowercaseLetterTrbl) * 150) +
  faceLetterAndDigitToNumber0to149(face);
export const number0to599ToFaceLetterDigitAndOrientation = (number0to599: number): Face => ({
  ...number0to149ToFaceLetterAndDigit(number0to599 % 150),
  orientationAsLowercaseLetterTrbl: clockwise90DegreeRotationsToTrbl(Math.floor(number0to599 / 150) % 4 as Clockwise90DegreeRotationsFromUpright)
});