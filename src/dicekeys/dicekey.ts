import {randomBytes} from "crypto";
// export * from "./face";
import {
  FaceLetter, FaceLetters, InvalidFaceLetterException,
  FaceDigit, InvalidFaceDigitException,
  Face, InvalidFaceRotationException,
  Clockwise90DegreeRotationsFromUpright,
  FaceOrientationLetterTrbl,
  ValidFaceOrientationLetterTrbl,
  FaceOrientationLetterTrblOrUnknown,
  InvalidFaceOrientationLettersTrblOrUnknownException,
  FaceOrientationLettersTrbl
} from "./face";


export const NumberOfFacesInKey = 25;

/**
 * Since DiceKeys have 25 faces, these generic tuple type allows us to
 * define an array of 25 items
 * (an array T[25] in a languages that support arrays with typed lengths)
 */
type TupleOf25Items<T> = [
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T
];

type ReadOnlyTupleOf25Items<T> = /* readonly */ [
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T
];

/**
 * Reduce the set of possible digits to 0..24 for precise index of 25 faces.
 */
export const FacePositions = [
   0 ,  1 ,  2 ,  3 ,  4 , 
   5 ,  6 ,  7 ,  8 ,  9 ,
  10 , 11 , 12 , 13 , 14 ,
  15 , 16 , 17 , 18 , 19 ,
  20 , 21 , 22 , 23 , 24
] as const;
export type FacePosition = typeof FacePositions[number];


export class InvalidDiceKeyException extends Error {}

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

const validateDiceKey = (diceKey: readonly Face[]): diceKey is DiceKey => {
  if (diceKey.length !== NumberOfFacesInKey) {
    throw new Error("Invalid key length");
  }
  const lettersPresent = new Set<FaceLetter>();
  const absentLetters = new Set<FaceLetter>(FaceLetters);
  const repeatedLetters = new Set<FaceLetter>();
  diceKey.forEach( ({letter, digit, orientationAsLowercaseLetterTRBL}, position) => {
    if (!FaceLetter.isValid(letter)) {
      throw new InvalidFaceLetterException(letter, {position});
    }
    if (!FaceDigit.isValid(digit)) {
      throw new InvalidFaceDigitException(digit, {position});
    }
    if (!FaceOrientationLetterTrblOrUnknown.isValid(orientationAsLowercaseLetterTRBL)) {
      throw new InvalidFaceOrientationLettersTrblOrUnknownException(orientationAsLowercaseLetterTRBL, {position});
    }
    if (letter != null && lettersPresent.has(letter)) {
      repeatedLetters.add(letter);
    } else if (letter != null) {
      lettersPresent.add(letter);
      absentLetters.delete(letter);
    }
  });
  if (absentLetters.size > 0 || repeatedLetters.size > 0) {
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




const getRandomDiceKey = (numberOfFaces: number = 6): DiceKey => {
  const remainingLetters = [...FaceLetters];
  const r = randomBytes(NumberOfFacesInKey * 12);
  return Array.from({ length: NumberOfFacesInKey }, (_, i): Face => {
    const offset = i * 12;
    // Pull out a letter at random from the remainingLetters array
    const letterIndex = r.readUInt32LE(offset) % remainingLetters.length;
    const letter = remainingLetters.splice(letterIndex, 1)[0] as FaceLetter;
    // Generate a digit at random
    const digit = ((r.readUInt32LE(offset + 4) % numberOfFaces) + 1).toString() as FaceDigit;
    const orientationAsLowercaseLetterTRBL = FaceOrientationLettersTrbl[Clockwise90DegreeRotationsFromUpright(r.readUInt32LE(offset + 8) % 4)];
    const faceAndOrientation: Face = {
      digit, letter, orientationAsLowercaseLetterTRBL
    };
    return faceAndOrientation;
  }) as DiceKey;
}

/**
 * DiceKeys as 75 characters, with each element represented as a
 * three-character sequence of:
 *   letter,
 *   digit ['1' - '6'],
 *   FaceRotationLetter
 * [letter][digit][FaceRotationLetter]
 */
enum DiceKeyInHumanReadableFormType { _ = "" };
export type DiceKeyInHumanReadableForm = DiceKeyInHumanReadableFormType & string;

export const DiceKeyInHumanReadableForm = (diceKey: DiceKey): DiceKeyInHumanReadableForm =>
  diceKey.map( face =>
    (face.letter != null ? face.letter : "?") +
    (face.digit != null ? face.digit : "?") +
    (face.orientationAsLowercaseLetterTRBL || "?")
  ).join("") as DiceKeyInHumanReadableForm

const diceKeyFromHumanReadableForm = (
  humanReadableForm: DiceKeyInHumanReadableForm
): DiceKey<Face> => {
  if (typeof(humanReadableForm) !== "string" || humanReadableForm.length !== 75) {
    throw new InvalidDiceKeyException("Invalid human-readable-form string length");
  }
  const diceKey: DiceKey = FacePositions.map( position => {
    const base = position * 3;
    const [
      letter,
      digitString,
      orientationAsLowercaseLetterTRBL
    ] = humanReadableForm.substr(3 * position, 3).split("");
    const positionObj = {position: position as FacePosition};
    const faceAndOrientation: Face = {
      letter: FaceLetter(letter, positionObj),
      digit: FaceDigit(digitString, positionObj),
      orientationAsLowercaseLetterTRBL: FaceOrientationLetterTrblOrUnknown(orientationAsLowercaseLetterTRBL, positionObj)
    };
    return faceAndOrientation;
  }) as readonly Face[] as DiceKey;
  validateDiceKey(diceKey);
  return diceKey;
}

/**
 * A DiceKey is an array of 25 dice in a 5x5 grid, ordered from left to right and then top down.
 * To canonicalize which element in the grid is the top-left (element #1, or item 0 in the array),
 * we choose the one with the lowest unicode string (the one with the letter with the lowest
 * charCode.) 
 */
export type DiceKey<F extends Face = Face> = ReadOnlyTupleOf25Items<F>;
/**
 * Construct a dice key either from a tuple of 25 ElemeentFace objects,
 * 25 indexes (which represent a element, face, and rotation), or from the
 * 75-character representation used by the OCR algorithm.
 * @param diceKeyOr25FaceIndexesOr29WordsOrOcrResultString 
 */
export function DiceKey(
  diceKeyAsFacesOrHumanReadableForm: string
) : DiceKey<Face>;
export function DiceKey<F extends Face = Face>(
  diceKeyAsFacesOrHumanReadableForm : ReadonlyArray<F>
): DiceKey<F>;
export function DiceKey<F extends Face = Face>(
  diceKeyAsFacesOrHumanReadableForm: string | ReadonlyArray<F>
) {
  if (typeof(diceKeyAsFacesOrHumanReadableForm) === "string") {
    return diceKeyFromHumanReadableForm(diceKeyAsFacesOrHumanReadableForm as DiceKeyInHumanReadableForm);
  }
  if (validateDiceKey(diceKeyAsFacesOrHumanReadableForm as TupleOf25Items<F>)) {
    return diceKeyAsFacesOrHumanReadableForm as DiceKey<F>;
  }
  throw new InvalidDiceKeyException("Invalid key format.");
}


const rotationIndexes5x5: {[rotation in Clockwise90DegreeRotationsFromUpright]: ReadOnlyTupleOf25Items<number>} = {
  0: [
     0,  1,  2,  3,  4,
     5,  6,  7,  8,  9,
    10, 11, 12, 13, 14,
    15, 16, 17, 18, 19,
    20, 21, 22, 23, 24
   ],
   1: [
     20, 15, 10,  5,  0,
     21, 16, 11,  6,  1,
     22, 17, 12,  7,  2,
     23, 18, 13,  8,  3,
     24, 19, 14,  9,  4
   ],
   2: [
     24, 23, 22, 21, 20,
     19, 18, 17, 16, 15,
     14, 13, 12, 11, 10,
      9,  8,  7,  6,  5,
      4,  3,  2,  1,  0
   ],
   3: [
     4,  9, 14, 19, 24,
     3,  8, 13, 18, 23,
     2,  7, 12, 17, 22,
     1,  6, 11, 16, 21,
     0,  5, 10, 15, 20,
   ],
 };

//  )
type RotateFaceFn<F extends Face> = (
    f: F,
    clockwise90DegreeTurnsToRotate: number
  ) => F;

const defaultRotateFaceFn = <F extends Face>(
    {orientationAsLowercaseLetterTRBL, ...rest}: F,
    clockwise90DegreeTurnsToRotate: number
) => ({
  ...rest,
  // Since we're turning the box clockwise, the rotation of each element rotates as well
  // If it was rightside up (0) and we rotate the box 90, it's now at 90
  // If it was upside down (180), and we rotate it the box 270,
  // it's now at 270+90 = 270 (mod 360)
  orientationAsLowercaseLetterTRBL: FaceOrientationLetterTrblOrUnknown.rotate(orientationAsLowercaseLetterTRBL, clockwise90DegreeTurnsToRotate)
} as F)

export function rotateDiceKey<F extends Face = Face>(
  diceKey: DiceKey<F>,
  clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright,
  rotateFaceFn: RotateFaceFn<F>
): DiceKey<F>;
export function rotateDiceKey(
  diceKey: DiceKey<Face>,
  clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright,
): DiceKey;
export function rotateDiceKey<F extends Face = Face>(
  diceKey: DiceKey<F>,
  clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright,
  rotateFaceFn: RotateFaceFn<F> = defaultRotateFaceFn
) : DiceKey<F> {
  return DiceKey<F>(
    rotationIndexes5x5[clockwise90DegreeRotationsFromUpright]
      .map( i => diceKey[i] )
      .map( faceAndRotation => rotateFaceFn(faceAndRotation, clockwise90DegreeRotationsFromUpright) ) 
  );
}

const FaceRotationsNonStationary = [1, 2, 3] as const;
export function rotateToRotationIndependentForm<F extends Face = Face>(
  diceKey: DiceKey<Face>,
  rotateFaceFn: RotateFaceFn<F>
): DiceKey;
export function rotateToRotationIndependentForm(
  diceKey: DiceKey<Face>,
): DiceKey;
export function rotateToRotationIndependentForm<F extends Face = Face>(
  diceKey: DiceKey<F>,
  rotateFaceFn: RotateFaceFn<F> = defaultRotateFaceFn
): DiceKey<F> {
  let rotationIndependentDiceKey: DiceKey<F> = diceKey;
  let earliestHumanReadableForm: DiceKeyInHumanReadableForm = DiceKey.toHumanReadableForm(diceKey);
  for (const candidateRotation of FaceRotationsNonStationary) {
    // If the candidate rotation would result in the square having a top-left letter
    // that is earlier in sort order (lower unicode character) than the current rotation,
    // replace the current rotation with the candidate rotation.
    const rotatedDiceKey = rotateDiceKey<F>(diceKey, candidateRotation, rotateFaceFn)
    const humanReadableForm  = DiceKey.toHumanReadableForm(rotatedDiceKey);
    if (humanReadableForm < earliestHumanReadableForm) {
      earliestHumanReadableForm = humanReadableForm;
      rotationIndependentDiceKey = rotatedDiceKey;
    }
  }
  return rotationIndependentDiceKey;
}
  
DiceKey.validate = validateDiceKey;
DiceKey.fromRandom = getRandomDiceKey;
DiceKey.fromHumanReadableForm = diceKeyFromHumanReadableForm;
DiceKey.toHumanReadableForm = DiceKeyInHumanReadableForm;
DiceKey.rotate = rotateDiceKey;
DiceKey.rotateToRotationIndependentForm = rotateToRotationIndependentForm;
DiceKey.toStringOf25Triples = DiceKeyInHumanReadableForm;
