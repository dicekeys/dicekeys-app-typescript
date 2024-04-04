/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  FaceLetter, FaceLetters, InvalidFaceLetterException,
  FaceDigit, InvalidFaceDigitException,
  FaceOrientationLetterTrblOrUnknown,
  InvalidFaceOrientationLettersTrblOrUnknownException, OrientedFace
} from "./Face";
import {
  DiceKeyFaces,
  NumberOfFacesInKey,
  FacePosition
} from "./KeyGeometry"
import {InvalidDiceKeyException} from "./InvalidDiceKeyException";

export class DiceKeyLettersRepeatedAndAbsentException extends InvalidDiceKeyException {
  public readonly repeatedLettersWithPositions: [FaceLetter, FacePosition[]][];
  public readonly absentLetters: FaceLetter[];
  constructor({
    absentLetters, repeatedLettersWithPositions
  }: {
    absentLetters: FaceLetter[],
    repeatedLettersWithPositions: [FaceLetter, FacePosition[]][],
  }) {
    const repeated = repeatedLettersWithPositions.map( ([letter, positions]) => {
      return `${letter} (at positions ${positions.join(", ")})`
    }).join(", ");
    const absent = [...absentLetters].join(", ");
    const message =
      `Invalid or misread DiceKey, with more than one instance of letter(s) ${repeated} and missing letter(s) ${absent}.`
    super(message);
    this.repeatedLettersWithPositions = repeatedLettersWithPositions;
    this.absentLetters = absentLetters;
  }
}

export interface DiceKeyValidationOptions {
  requireOneOfEachLetter?: boolean
  throwOnFailures?: boolean
 }

export const validateDiceKey = (diceKey: readonly Partial<OrientedFace>[], {
  requireOneOfEachLetter = false,
  throwOnFailures = false
} : DiceKeyValidationOptions = {}): diceKey is DiceKeyFaces => {
  if (diceKey.length !== NumberOfFacesInKey) {
    if (!throwOnFailures) { return false; }
    throw new Error(`A DiceKey must have ${NumberOfFacesInKey} faces (not ${diceKey.length})`);
  }
  const lettersPresent = new Set<FaceLetter>();
  const absentLetters = new Set<FaceLetter>(FaceLetters);
  const repeatedLetters = new Set<FaceLetter>();
  for (let position = 0; position < NumberOfFacesInKey; position++) {
    const {letter, digit, orientationAsLowercaseLetterTrbl} = diceKey[position]!;
    if (!FaceLetter.isValid(letter)) {
      if (!throwOnFailures) { return false; }
      throw new InvalidFaceLetterException(letter, {position});
    }
    if (!FaceDigit.isValid(digit)) {
      if (!throwOnFailures) { return false; }
      throw new InvalidFaceDigitException(digit, {position});
    }
    if (!FaceOrientationLetterTrblOrUnknown.isValid(orientationAsLowercaseLetterTrbl)) {
      if (!throwOnFailures) { return false; }
      throw new InvalidFaceOrientationLettersTrblOrUnknownException(orientationAsLowercaseLetterTrbl, {position});
    }
    if (letter != null && lettersPresent.has(letter)) {
      repeatedLetters.add(letter);
    } else if (letter != null) {
      lettersPresent.add(letter);
      absentLetters.delete(letter);
    }
  }
  if (requireOneOfEachLetter && (absentLetters.size > 0 || repeatedLetters.size > 0)) {
    if (!throwOnFailures) { return false; }
    const repeatedLettersWithPositions = Array.from(repeatedLetters).map( letter => [
      letter, 
      diceKey.reduce( ( result, d, index) => {
        if (d.letter === letter ) {
          result.push(index as FacePosition);
        }
        return result;
      }, [] as FacePosition[])
    ] as [FaceLetter, FacePosition[]]);
    throw new DiceKeyLettersRepeatedAndAbsentException({
      absentLetters: Array.from(absentLetters),
      repeatedLettersWithPositions});
  }
  return true;
}
