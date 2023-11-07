import { getRandomUInt32 } from "../../utilities/get-random-bytes";
import { PointInIntegerSpace } from "../../utilities/ShamirSecretSharing";
import {
  Face,
  OrientedFace,
  faceLetterAndDigitToNumber0to149, faceLetterDigitAndOrientationToNumber0to599,
  number0to149ToFaceLetterAndDigit,
  number0to599ToFaceLetterDigitAndOrientation,
  NumberOfPossibleFaces
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

export const facesToShamirShareFiniteFieldPoint = (faces: DiceKeyFaces): ShamirShareAsFiniteFieldPoint => {
  const facesCenterUpright = rotateToTurnCenterFaceUpright(faces) as readonly OrientedFace[];
  // remove center die
  const [centerDie] = (facesCenterUpright as OrientedFace[]).splice(12, 1);
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
  const centerFace: OrientedFace = {
    ...number0to149ToFaceLetterAndDigit(Number(share.x)),
    orientationAsLowercaseLetterTrbl: 't'
  };
  return DiceKeyFaces([...faces24.slice(0,12), centerFace, ...faces24.slice(12)]);
}
