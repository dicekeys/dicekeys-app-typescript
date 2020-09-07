import {getRandomUInt32} from "./get-random-bytes";
import {
  FaceLetter, FaceLetters, InvalidFaceLetterException,
  FaceDigit, InvalidFaceDigitException,
  Face,
  Clockwise90DegreeRotationsFromUpright,
  FaceOrientationLetterTrblOrUnknown,
  InvalidFaceOrientationLettersTrblOrUnknownException,
  FaceOrientationLettersTrbl
} from "@dicekeys/read-dicekey-js";
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";


export const NumberOfFacesInKey = 25;

/**
 * Since DiceKeys have 25 faces, these generic tuple type allows us to
 * define an array of 25 items
 * (an array T[25] in a languages that support arrays with typed lengths)
 */
export type TupleOf25Items<T> = [
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T
];

export type ReadOnlyTupleOf25Items<T> = /* readonly */ [
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

const validateDiceKey = (diceKey: readonly Face[], requireOneOfEachLetter: boolean = false): diceKey is DiceKey => {
  if (diceKey.length !== NumberOfFacesInKey) {
    throw new Error("Invalid key length");
  }
  const lettersPresent = new Set<FaceLetter>();
  const absentLetters = new Set<FaceLetter>(FaceLetters);
  const repeatedLetters = new Set<FaceLetter>();
  diceKey.forEach( ({letter, digit, orientationAsLowercaseLetterTrbl}, position) => {
    if (!FaceLetter.isValid(letter)) {
      throw new InvalidFaceLetterException(letter, {position});
    }
    if (!FaceDigit.isValid(digit)) {
      throw new InvalidFaceDigitException(digit, {position});
    }
    if (!FaceOrientationLetterTrblOrUnknown.isValid(orientationAsLowercaseLetterTrbl)) {
      throw new InvalidFaceOrientationLettersTrblOrUnknownException(orientationAsLowercaseLetterTrbl, {position});
    }
    if (letter != null && lettersPresent.has(letter)) {
      repeatedLetters.add(letter);
    } else if (letter != null) {
      lettersPresent.add(letter);
      absentLetters.delete(letter);
    }
  });
  if (requireOneOfEachLetter && (absentLetters.size > 0 || repeatedLetters.size > 0)) {
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
  return Array.from({ length: NumberOfFacesInKey }, (): Face => {
    // Pull out a letter at random from the remainingLetters array
    const letterIndex = getRandomUInt32() % remainingLetters.length;
    const letter = remainingLetters.splice(letterIndex, 1)[0] as FaceLetter;
    // Generate a digit at random
    const digit = ((getRandomUInt32() % numberOfFaces) + 1).toString() as FaceDigit;
    const clockwiseOrientationsFromUpright = getRandomUInt32() % 4;
    const orientationAsLowercaseLetterTrbl =
      FaceOrientationLettersTrbl[Clockwise90DegreeRotationsFromUpright(clockwiseOrientationsFromUpright % 4)];
    const faceAndOrientation: Face = {
      digit, letter, orientationAsLowercaseLetterTrbl
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
    (face.orientationAsLowercaseLetterTrbl || "?")
  ).join("") as DiceKeyInHumanReadableForm

const diceKeyFromHumanReadableForm = (
  humanReadableForm: DiceKeyInHumanReadableForm,
  requireOneOfEachLetter: boolean = false 
): DiceKey<Face> => {
  if (typeof(humanReadableForm) !== "string" || humanReadableForm.length !== 75) {
    throw new InvalidDiceKeyException("Invalid human-readable-form string length");
  }
  const diceKey: DiceKey = FacePositions.map( position => {
    const [
      letter,
      digitString,
      orientationAsLowercaseLetterTrbl
    ] = humanReadableForm.substr(3 * position, 3).split("");
    const positionObj = {position: position as FacePosition};
    const faceAndOrientation: Face = {
      letter: FaceLetter(letter, positionObj),
      digit: FaceDigit(digitString, positionObj),
      orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrblOrUnknown(orientationAsLowercaseLetterTrbl, positionObj)
    };
    return faceAndOrientation;
  }) as readonly Face[] as DiceKey;
  validateDiceKey(diceKey, requireOneOfEachLetter);
  return diceKey;
}

/**
 * A DiceKey is an array of 25 dice in a 5x5 grid, ordered from left to right and then top down.
 * To canonicalize which element in the grid is the top-left (element #1, or item 0 in the array),
 * we choose the one with the lowest unicode string (the one with the letter with the lowest
 * charCode.) 
 */
export type DiceKey<F extends Face = Face> = ReadOnlyTupleOf25Items<F>;
export type PartialDiceKey = ReadOnlyTupleOf25Items<Partial<Face>>
/**
 * Construct a dice key either from a tuple of 25 ElementFace objects,
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
    {orientationAsLowercaseLetterTrbl, ...rest}: F,
    clockwise90DegreeTurnsToRotate: number
) => ({
  ...rest,
  // Since we're turning the box clockwise, the rotation of each element rotates as well
  // If it was right-side up (0) and we rotate the box 90, it's now at 90
  // If it was upside down (180), and we rotate it the box 270,
  // it's now at 270+90 = 270 (mod 360)
  orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrblOrUnknown.rotate(orientationAsLowercaseLetterTrbl, clockwise90DegreeTurnsToRotate)
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

const removeOrientations = <F extends Face = Face>(
  diceKey: DiceKey<F>,
): DiceKey => DiceKey<F>(diceKey.map( face => ({...face, orientationAsLowercaseLetterTrbl: "?"})));


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

const applyDerivationOptions = (
  diceKey: DiceKey,
  derivationOptions: DerivationOptions | string
): DiceKey => {
  return (DerivationOptions(derivationOptions).excludeOrientationOfFaces) ?
    removeOrientations(diceKey) :
    diceKey;
}

/**
 * Create a seed string from a DiceKey and a set of derivation options.
 * 
 * If the derivation options specify `"excludeOrientationOfFaces": true`, then
 * the first step will remove all orientations from the DiceKey.
 * 
 * The second step is to rotate the DiceKey to canonical orientation. Since
 * that orientation is based on the sort order of the DiceKey's human-readable
 * form, and since that human-readable form contains orientation characters,
 * this step comes after the optional exclusion of orientations.
 * 
 * The last step is to turn the 25 dice into triples of letter, digit, orientation
 * via the [toHumanReadableForm] function.
 * 
 * 
 * @param diceKey 
 * @param derivationOptions 
 */
const toSeedString = (
  diceKey: DiceKey,
  derivationOptionsObjectOrJson: DerivationOptions | string
): DiceKeyInHumanReadableForm => {
  const preCanonicalDiceKey: DiceKey = applyDerivationOptions(diceKey, derivationOptionsObjectOrJson);
  const canonicalDiceKey = rotateToRotationIndependentForm(preCanonicalDiceKey); 
  const humanReadableForm = DiceKeyInHumanReadableForm(canonicalDiceKey);
  return humanReadableForm;
}
  
DiceKey.validate = validateDiceKey;
DiceKey.fromRandom = getRandomDiceKey;
DiceKey.fromHumanReadableForm = diceKeyFromHumanReadableForm;
DiceKey.toHumanReadableForm = DiceKeyInHumanReadableForm;
DiceKey.rotate = rotateDiceKey;
DiceKey.rotateToRotationIndependentForm = rotateToRotationIndependentForm;
DiceKey.toStringOf25Triples = DiceKeyInHumanReadableForm;
DiceKey.removeOrientations = removeOrientations;
DiceKey.toSeedString = toSeedString;
DiceKey.applyDerivationOptions = applyDerivationOptions;
DiceKey.cornerIndexesClockwise = [0, 4, 24, 20] as const;
DiceKey.cornerIndexSet = new Set<number>(DiceKey.cornerIndexesClockwise);
