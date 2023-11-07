import {
  Face
  } from "./Face";
import { DiceKeyFaces } from "./KeyGeometry";
import { rotateToTurnCenterFaceUpright } from "./Rotation";
import { PointInIntegerSpace } from "../../utilities/ShamirSecretSharing";
import { faceLetterAndDigitToNumber0to149, faceLetterDigitAndOrientationToNumber0to599, number0to599ToFaceLetterDigitAndOrientation, number0to149ToFaceLetterAndDigit } from "./numericConversions";

export type ShamirShareAsFiniteFieldPoint = PointInIntegerSpace<bigint>;

export const facesTooShamirShareFiniteFieldPoint = (faces: DiceKeyFaces): ShamirShareAsFiniteFieldPoint => {
  const facesCenterUpright = rotateToTurnCenterFaceUpright(faces) as readonly Face[];
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
