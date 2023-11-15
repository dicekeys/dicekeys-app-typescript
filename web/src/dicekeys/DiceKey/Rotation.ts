import { OrientedFace, FaceOrientationLetterTrblOrUnknown } from "./Face";
import { Clockwise90DegreeRotationsFromUpright, DiceKeyFaces, ReadOnlyTupleOf25Items, rotationIndexes5x5 } from "./KeyGeometry";
import { DiceKeyInHumanReadableForm } from "./HumanReadableForm";

type RotateFaceFn<F extends OrientedFace> = (
  f: F,
  clockwise90DegreeTurnsToRotate: number
) => F;
const defaultRotateFaceFn = <F extends OrientedFace>(
  { orientationAsLowercaseLetterTrbl, letter, digit, ...rest }: F,
  clockwise90DegreeTurnsToRotate: number
) => ({
  ...rest,
  letter,
  digit,
  // Since we're turning the box clockwise, the rotation of each element rotates as well
  // If it was right-side up (0) and we rotate the box 90, it's now at 90
  // If it was upside down (180), and we rotate it the box 270,
  // it's now at 270+90 = 270 (mod 360)
  orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrblOrUnknown.rotate(orientationAsLowercaseLetterTrbl, clockwise90DegreeTurnsToRotate)
} as F);


export function rotateDiceKey<F extends OrientedFace = OrientedFace>(
  diceKey: DiceKeyFaces<F>,
  clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright,
  rotateFaceFn: RotateFaceFn<F> = defaultRotateFaceFn<F>
): DiceKeyFaces<F> {
  const result = ReadOnlyTupleOf25Items(
    rotationIndexes5x5[clockwise90DegreeRotationsFromUpright]
      .map(i => diceKey[i]!)
      .map(faceAndRotation => rotateFaceFn(faceAndRotation, clockwise90DegreeRotationsFromUpright))
  );
  return result;
}
const FaceRotationsNonStationary = [1, 2, 3] as const;
export function rotateToRotationIndependentForm<F extends OrientedFace = OrientedFace>(
  diceKey: DiceKeyFaces<OrientedFace>,
  rotateFaceFn: RotateFaceFn<F>
): DiceKeyFaces;
export function rotateToRotationIndependentForm(
  diceKey: DiceKeyFaces<OrientedFace>
): DiceKeyFaces;
export function rotateToRotationIndependentForm<F extends OrientedFace = OrientedFace>(
  diceKey: DiceKeyFaces<F>,
  rotateFaceFn: RotateFaceFn<F> = defaultRotateFaceFn
): DiceKeyFaces<F> {
  let rotationIndependentDiceKey: DiceKeyFaces<F> = diceKey;
  let earliestHumanReadableForm: DiceKeyInHumanReadableForm = DiceKeyInHumanReadableForm(diceKey);
  for (const candidateRotation of FaceRotationsNonStationary) {
    // If the candidate rotation would result in the square having a top-left letter
    // that is earlier in sort order (lower unicode character) than the current rotation,
    // replace the current rotation with the candidate rotation.
    const rotatedDiceKey = rotateDiceKey<F>(diceKey, candidateRotation, rotateFaceFn);
    const humanReadableForm = DiceKeyInHumanReadableForm(rotatedDiceKey);
    if (humanReadableForm < earliestHumanReadableForm) {
      earliestHumanReadableForm = humanReadableForm;
      rotationIndependentDiceKey = rotatedDiceKey;
    }
  }
  return rotationIndependentDiceKey;
}

export const rotateToTurnCenterFaceUpright = <F extends OrientedFace = OrientedFace>(
  diceKey: DiceKeyFaces<F>,
  rotateFaceFn: RotateFaceFn<F> = defaultRotateFaceFn
): DiceKeyFaces<F> => {
  const centerFacesOrientationTrbl = diceKey[12].orientationAsLowercaseLetterTrbl;
  switch (centerFacesOrientationTrbl) {
    case "t": return [...diceKey];
    case "l": return rotateDiceKey<F>(diceKey, 1, rotateFaceFn);
    case "b": return rotateDiceKey<F>(diceKey, 2, rotateFaceFn);
    case "r": return rotateDiceKey<F>(diceKey, 3, rotateFaceFn);
  }
}