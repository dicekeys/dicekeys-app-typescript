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
import { DiceKeyFaces } from "./KeyGeometry";
import { rotateToTurnCenterFaceUpright } from "./Rotation";
import { PointInIntegerSpace } from "../../utilities/ShamirSecretSharing";

type Number0To5 = 0 | 1 | 2 | 3 | 4 | 5;
type Number0To24 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;

const faceLetterToNumber0to24 = (faceLetter: FaceLetter) => FaceLetters.indexOf(faceLetter) as Number0To24;
const number0to24ToFaceLetter = (number0to24: Number0To24) =>  FaceLetters[number0to24];

const faceDigitToNumber0to5 = (faceDigit: FaceDigit) => FaceDigits.indexOf(faceDigit) as Number0To5;
const number0to6ToFaceDigit = (number0to5: Number0To5) =>  FaceDigits[number0to5];

const faceOrientationTrblToClockwise90RotationsFromUpright = (faceOrientationTrbl: FaceOrientationLetterTrbl) =>
  FaceOrientationLettersTrbl.indexOf(faceOrientationTrbl) as Clockwise90DegreeRotationsFromUpright;
const clockwise90DegreeRotationsToTrbl = (number0To3: Clockwise90DegreeRotationsFromUpright) =>  FaceOrientationLettersTrbl[number0To3];

export const faceLetterAndDigitToNumber0to149 = (face: FaceIdentifiers) =>
  (faceLetterToNumber0to24(face.letter) * 6) + faceDigitToNumber0to5(face.digit);
export const number0to149ToFaceLetterAndDigit = (number0to149: number): FaceIdentifiers => ({
  digit: number0to6ToFaceDigit(number0to149 %6 as Number0To5),
  letter: number0to24ToFaceLetter(Math.floor(number0to149 / 6) % 25 as Number0To24),
})

export const faceLetterDigitAndOrientationToNumber0to599 = (face: Face) =>
  (faceOrientationTrblToClockwise90RotationsFromUpright(face.orientationAsLowercaseLetterTrbl) * 150) +
  faceLetterAndDigitToNumber0to149(face);
export const number0to599ToFaceLetterDigitAndOrientation = (number0to599: number): Face => ({
  ...number0to149ToFaceLetterAndDigit(number0to599 % 150),
  orientationAsLowercaseLetterTrbl: clockwise90DegreeRotationsToTrbl(Math.floor(number0to599 / 150) % 4 as Clockwise90DegreeRotationsFromUpright)
})

export type ShamirShareAsFiniteFieldPoint = PointInIntegerSpace<bigint>

export const facesTooShamirShareFiniteFieldPoint = (faces: DiceKeyFaces): ShamirShareAsFiniteFieldPoint => {
  const facesCenterUpright = rotateToTurnCenterFaceUpright([...faces]) as readonly Face[];
  // remove center die
  const [centerDie] = (facesCenterUpright as Face[]).splice(12, 1);
  if (centerDie == null || facesCenterUpright.length != 24) {
    throw new RangeError(`DiceKey must have 25 faces`);
  }
  const x = BigInt(faceLetterAndDigitToNumber0to149(centerDie));
  const y: bigint = facesCenterUpright.reduce( (asBigInt, face) =>
    (asBigInt * 600n) + BigInt(faceLetterDigitAndOrientationToNumber0to599(face)),
    0n
  )
  return {x, y};
}

export const shamirShareFiniteFieldPointToFaces = (share: ShamirShareAsFiniteFieldPoint) => {
  let {y} = share;
  const faces24 = [...Array(24).keys()].map( () => {
    const face = number0to599ToFaceLetterDigitAndOrientation(Number(y % 600n))
    y /= 600n;
    return face;
  }).reverse();
  const centerFace: Face = {
    ...number0to149ToFaceLetterAndDigit(Number(share.x)),
    orientationAsLowercaseLetterTrbl: 't'
  };
  return DiceKeyFaces([...faces24.slice(0,12), centerFace, ...faces24.slice(12)]);
}
