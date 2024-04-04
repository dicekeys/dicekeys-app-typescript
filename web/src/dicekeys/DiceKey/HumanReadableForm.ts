import type { DiceKeyInHumanReadableForm as BridgeDiceKeyInHumanReadableForm } from "../../../../common/IElectronBridge";
import {
  OrientedFace,
  FaceDigit, FaceLetter, FaceOrientationLetterTrbl
} from "./Face";
import { InvalidDiceKeyException } from "./InvalidDiceKeyException";
import { DiceKeyFaces, FacePosition, FacePositions } from "./KeyGeometry";
import { DiceKeyValidationOptions, validateDiceKey } from "./validateDiceKey";


export const FaceInHumanReadableForm = ({ letter, digit, orientationAsLowercaseLetterTrbl }: OrientedFace): string => `${letter}${digit}${orientationAsLowercaseLetterTrbl}`;

export const FaceFromHumanReadableForm = (hrf: string, options?: { position?: number; }): OrientedFace => ({
  letter: FaceLetter(hrf[0]!, options),
  digit: FaceDigit(hrf[1]!, options),
  orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl(hrf[2]!, options)
});

export type DiceKeyInHumanReadableForm = BridgeDiceKeyInHumanReadableForm;
export const DiceKeyInHumanReadableForm = (diceKey: DiceKeyFaces): DiceKeyInHumanReadableForm => diceKey.map(face => FaceInHumanReadableForm(face)).join("") as DiceKeyInHumanReadableForm;

export const diceKeyFacesFromHumanReadableForm = (
  humanReadableForm: DiceKeyInHumanReadableForm,
  validationOptions: DiceKeyValidationOptions = {}
): DiceKeyFaces<OrientedFace> => {
  if (typeof (humanReadableForm) !== "string") {
    throw new InvalidDiceKeyException("DiceKey in human-readable-form must be a string");
  }
  if (humanReadableForm.length !== 75) {
    throw new InvalidDiceKeyException("Invalid human-readable-form string length");
  }
  const charsPerFace = 3;
  const diceKey: DiceKeyFaces = FacePositions.map(position => {
    const [
      letter, digitString, orientationAsLowercaseLetterTrbl
    ] = humanReadableForm.substring(charsPerFace * position, charsPerFace * (position + 1)).split("") as [string, string, string];
    const positionObj = { position: position as FacePosition };
    const faceAndOrientation: OrientedFace = {
      letter: FaceLetter(letter, positionObj),
      digit: FaceDigit(digitString, positionObj),
      orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl(orientationAsLowercaseLetterTrbl, positionObj)
    };
    return faceAndOrientation;
  }) as readonly OrientedFace[] as DiceKeyFaces;
  validateDiceKey(diceKey, { throwOnFailures: true, ...validationOptions });
  return diceKey;
};
