import type {
  FaceIdentifiers,
  FaceOrientationLetterTrbl,
} from "@dicekeys/read-dicekey-js";
export {
  FaceLetter, FaceLetters, InvalidFaceLetterException,
  FaceDigit, InvalidFaceDigitException,
  FaceOrientationLetterTrblOrUnknown,
  InvalidFaceOrientationLettersTrblOrUnknownException,
  FaceOrientationLettersTrbl,
  FaceDigits,
  FaceOrientationLetterTrbl
} from "@dicekeys/read-dicekey-js";
export type {
  FaceIdentifiers
} from "@dicekeys/read-dicekey-js";

export type Face = FaceIdentifiers & {
  orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl
}
