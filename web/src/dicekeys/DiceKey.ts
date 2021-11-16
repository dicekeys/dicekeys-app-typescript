import {getRandomUInt32} from "../utilities/get-random-bytes";
import { uint8ClampedArrayToHexString } from "../utilities/convert";
import {
  FaceLetter, FaceLetters, InvalidFaceLetterException,
  FaceDigit, InvalidFaceDigitException,
  Clockwise90DegreeRotationsFromUpright,
  FaceOrientationLetterTrblOrUnknown,
  InvalidFaceOrientationLettersTrblOrUnknownException,
  FaceOrientationLettersTrbl,
  FaceDigits,
  FaceOrientationLetterTrbl,
  FaceIdentifiers
} from "@dicekeys/read-dicekey-js";

export type Face = FaceIdentifiers & {
  orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl
}

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

export type ReadOnlyTupleOf25Items<T> = readonly [
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T,
  T, T, T, T, T
];
export const ReadOnlyTupleOf25Items = <T>(fromArray: T[] | ReadOnlyTupleOf25Items<T>): ReadOnlyTupleOf25Items<T> => {
  if (fromArray.length !== 25) {
    throw new Error("Expected tuple of 25 items");
  }
  // Hack to make TypeScript happy that lengths match,
  // making a copy since the source might not have been read-only.
  return [...fromArray] as unknown as ReadOnlyTupleOf25Items<T>;
}

/**
 * A DiceKey is an array of 25 dice in a 5x5 grid, ordered from left to right and then top down.
 * To canonicalize which element in the grid is the top-left (element #1, or item 0 in the array),
 * we choose the one with the lowest unicode string (the one with the letter with the lowest
 * charCode.) 
 */
 export type DiceKeyFaces<F extends Face = Face> = ReadOnlyTupleOf25Items<F>;
 export const DiceKeyFaces = <F extends Face = Face>(faces: F[] | DiceKeyFaces<F>, validate: boolean = true) => {
  if (validate) {
    validateDiceKey(faces, {throwOnFailures: validate});
  }

   return ReadOnlyTupleOf25Items<F>(faces);
 }

export type PartialDiceKey = DiceKeyFaces | TupleOf25Items<Partial<Face>>
export const PartialDiceKey = <F extends Face = Face>(faces: Partial<F>[] | DiceKeyFaces<F>): TupleOf25Items<Partial<F>> => {
   return faces as unknown as TupleOf25Items<Partial<F>>;
 } 

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

export interface DiceKeyValidationOptions {
  requireOneOfEachLetter?: Boolean
  throwOnFailures?: boolean
 }

export const validateDiceKey = (diceKey: readonly Partial<Face>[], {
  requireOneOfEachLetter = false,
  throwOnFailures = false
} : DiceKeyValidationOptions = {}): diceKey is DiceKeyFaces => {
  if (diceKey.length !== NumberOfFacesInKey) {
    if (!throwOnFailures) { return false; }
    throw new Error(`A DiceKey must have ${NumberOfFacesInKey} faces`);
  }
  const lettersPresent = new Set<FaceLetter>();
  const absentLetters = new Set<FaceLetter>(FaceLetters);
  const repeatedLetters = new Set<FaceLetter>();
  for (var position = 0; position < NumberOfFacesInKey; position++) {
    const {letter, digit, orientationAsLowercaseLetterTrbl} = diceKey[position];
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




const getRandomDiceKey = (numberOfFacesPerDie: number = 6): DiceKeyFaces => {
  const remainingLetters = [...FaceLetters];
  return DiceKeyFaces(
    Array.from({ length: NumberOfFacesInKey }, (): Face => {
      // Pull out a letter at random from the remainingLetters array
      const letterIndex = getRandomUInt32() % remainingLetters.length;
      const letter = remainingLetters.splice(letterIndex, 1)[0] as FaceLetter;
      // Generate a digit at random
      const digit = ((getRandomUInt32() % numberOfFacesPerDie) + 1).toString() as FaceDigit;
      const clockwiseOrientationsFromUpright = getRandomUInt32() % 4;
      const orientationAsLowercaseLetterTrbl =
        FaceOrientationLettersTrbl[Clockwise90DegreeRotationsFromUpright(clockwiseOrientationsFromUpright % 4)];
      const faceAndOrientation: Face = {
        digit, letter, orientationAsLowercaseLetterTrbl
      };
      return faceAndOrientation;
  }));
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

export const FaceInHumanReadableForm = ({letter, digit, orientationAsLowercaseLetterTrbl}: Face): string =>
  `${letter}${digit}${orientationAsLowercaseLetterTrbl}`;

export const FaceFromHumanReadableForm = (hrf: string, options?: {position?: number}): Face => ({
  letter: FaceLetter(hrf[0], options),
  digit: FaceDigit(hrf[1], options),
  orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl(hrf[2], options)
})

export const DiceKeyInHumanReadableForm = (diceKey: DiceKeyFaces): DiceKeyInHumanReadableForm =>
  diceKey.map( face => FaceInHumanReadableForm(face) ).join("") as DiceKeyInHumanReadableForm

export const diceKeyFacesFromHumanReadableForm = (
  humanReadableForm: DiceKeyInHumanReadableForm,
  validationOptions: DiceKeyValidationOptions = {}
): DiceKeyFaces<Face> => {
  if (typeof(humanReadableForm) !== "string") {
    throw new InvalidDiceKeyException("DiceKey in human-readable-form must be a string");
  }
  const charsPerFace =
    humanReadableForm.length === 75 ? 3 :
    humanReadableForm.length === 50 ? 2 :
    ( () => { throw new InvalidDiceKeyException("Invalid human-readable-form string length"); })();

  const diceKey: DiceKeyFaces = FacePositions.map( position => {
    const [
      letter,
      digitString,
      orientationAsLowercaseLetterTrbl = "?"
    ] = humanReadableForm.substr(charsPerFace * position, charsPerFace).split("");
    const positionObj = {position: position as FacePosition};
    const faceAndOrientation: Face = {
      letter: FaceLetter(letter, positionObj),
      digit: FaceDigit(digitString, positionObj),
      orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl(orientationAsLowercaseLetterTrbl, positionObj)
    };
    return faceAndOrientation;
  }) as readonly Face[] as DiceKeyFaces;
  validateDiceKey(diceKey, {throwOnFailures: true, ...validationOptions});
  return diceKey;
}

export const EmptyPartialDiceKey = Array.from(Array(25).keys()).map( () => ({}) );

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

export interface FaceComparisonErrorTypes {
  letter?: true;
  digit?: true;
  orientationAsLowercaseLetterTrbl?: true;
}

export interface FaceComparisonError extends FaceComparisonErrorTypes {
  index: number;
}

const compareFaces = (a: Face, b: Face, index: number): FaceComparisonError | undefined => {
  const errors: FaceComparisonErrorTypes = {
    ...(a.letter !== b.letter ? {letter: true} : {}),
    ...(a.digit !== b.digit ? {digit: true} : {}),
    ...(a.orientationAsLowercaseLetterTrbl !== b.orientationAsLowercaseLetterTrbl ? {orientationAsLowercaseLetterTrbl: true} : {})
  }
  return Object.keys(errors).length > 0 ? {...errors, index} : undefined;
}

const compareDiceKeysAtFixedRotation = (a: DiceKeyBase, b: DiceKeyBase): FaceComparisonError[] =>
  a.faces
    .map( (aFace, index) => compareFaces(aFace, b.faces[index], index) )
    .filter( e => e != null ) as FaceComparisonError[];



//  )
type RotateFaceFn<F extends Face> = (
    f: F,
    clockwise90DegreeTurnsToRotate: number
  ) => F;

const defaultRotateFaceFn = <F extends Face>(
    {orientationAsLowercaseLetterTrbl, letter, digit, ...rest}: F,
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
} as F)

export function rotateDiceKey<F extends Face = Face>(
  diceKey: DiceKeyFaces<F>,
  clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright,
  rotateFaceFn: RotateFaceFn<F>
): DiceKeyFaces<F>;
export function rotateDiceKey(
  diceKey: DiceKeyFaces<Face>,
  clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright,
): DiceKeyFaces;
export function rotateDiceKey<F extends Face = Face>(
  diceKey: DiceKeyFaces<F>,
  clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright,
  rotateFaceFn: RotateFaceFn<F> = defaultRotateFaceFn
) : DiceKeyFaces<F> {
  return ReadOnlyTupleOf25Items(
    rotationIndexes5x5[clockwise90DegreeRotationsFromUpright]
      .map( i => diceKey[i] )
      .map( faceAndRotation => rotateFaceFn(faceAndRotation, clockwise90DegreeRotationsFromUpright) )
   );//  as DiceKeyFaces<F>;
}

const FaceRotationsNonStationary = [1, 2, 3] as const;
export function rotateToRotationIndependentForm<F extends Face = Face>(
  diceKey: DiceKeyFaces<Face>,
  rotateFaceFn: RotateFaceFn<F>
): DiceKeyFaces;
export function rotateToRotationIndependentForm(
  diceKey: DiceKeyFaces<Face>
): DiceKeyFaces;
export function rotateToRotationIndependentForm<F extends Face = Face>(
  diceKey: DiceKeyFaces<F>,
  rotateFaceFn: RotateFaceFn<F> = defaultRotateFaceFn
): DiceKeyFaces<F> {
  let rotationIndependentDiceKey: DiceKeyFaces<F> = diceKey;
  let earliestHumanReadableForm: DiceKeyInHumanReadableForm = DiceKeyInHumanReadableForm(diceKey);
  for (const candidateRotation of FaceRotationsNonStationary) {
    // If the candidate rotation would result in the square having a top-left letter
    // that is earlier in sort order (lower unicode character) than the current rotation,
    // replace the current rotation with the candidate rotation.
    const rotatedDiceKey = rotateDiceKey<F>(diceKey, candidateRotation, rotateFaceFn)
    const humanReadableForm  = DiceKeyInHumanReadableForm(rotatedDiceKey);
    if (humanReadableForm < earliestHumanReadableForm) {
      earliestHumanReadableForm = humanReadableForm;
      rotationIndependentDiceKey = rotatedDiceKey;
    }
  }
  return rotationIndependentDiceKey;
}

/**
 * Create a seed string from a DiceKey and a recipe in JSON format.
 * 
 * If the recipe specifies `"excludeOrientationOfFaces": true`, then
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
 * @param diceKeyFaces 
 * @param recipeObject 
 */
const diceKeyFacesToSeedString = (
  diceKeyFaces: DiceKeyFaces
): DiceKeyInHumanReadableForm => {
  const canonicalDiceKey = rotateToRotationIndependentForm(diceKeyFaces); 
  const humanReadableForm = DiceKeyInHumanReadableForm(canonicalDiceKey);
  return humanReadableForm;
}

/**
 * A DiceKey's keyId is the first 64 bits of the SHA256 hash of the DiceKey's seed string
 * in hex format
 * @param DiceKeyFaces 
 * @returns 16 characters representing a 64 bit (8 byte) prefix of the 256 hash of the seed string.
 */
const diceKeyFacesToKeyId = async (
  diceKeyFaces: DiceKeyFaces
): Promise<string> => {
  const keysSeedString = diceKeyFacesToSeedString(diceKeyFaces);
  const sha256HashOfSeed = await crypto.subtle.digest("SHA-256",  new TextEncoder().encode(keysSeedString));
  const first64BitsOfHashAsByteArray = sha256HashOfSeed.slice(0, 8)
  const first64BitsOfHashAsHexString = uint8ClampedArrayToHexString(new Uint8ClampedArray(first64BitsOfHashAsByteArray));
  return first64BitsOfHashAsHexString;
}

const factorialConstants0to25: bigint[] = Array.from(Array(26).keys()).reduce( (factorials) => {
  if (factorials.length === 0) factorials.push(BigInt(0));
  else if (factorials.length === 1) factorials.push(BigInt(1));
  else factorials.push(factorials[factorials.length - 1] * BigInt(factorials.length))
  return factorials;
}, [] as bigint[] );
const uniqueLetterEncodingSize = factorialConstants0to25[25];
const digitEncodingSize = BigInt(6) ** BigInt(24);
const uniqueOrientationEncodingSize = BigInt(4) ** BigInt(24);
export const SizeOfNumericEncodingForUniqueLetters = uniqueLetterEncodingSize * digitEncodingSize * uniqueOrientationEncodingSize;

const facesFromNumericForm = (numericForm: bigint): DiceKeyFaces => {
  const orientationsAsBigInt = numericForm % uniqueOrientationEncodingSize;
  let withoutOrientations = numericForm / uniqueOrientationEncodingSize;
  const digitsAsBigInt = withoutOrientations % digitEncodingSize;
  const withoutDigits = withoutOrientations / digitEncodingSize;
  const lettersAsBigInt = withoutDigits % uniqueLetterEncodingSize;

  const {orientations} = [...Array(24).keys()].reduce( (r, _, index) => {
    // Build right to left by reading the number from its least significant 2 bits to most-significant two bits
    // and appending orientations onto the start of the array.
    let {orientations, orientationsAsBigInt} = r;
    if (index == 12) {
      // the center face is always upright, so index 12 actually refers to the 13th face.
      r.orientations.unshift("t")
    }
    orientations.unshift(FaceOrientationLettersTrbl[Number(orientationsAsBigInt % 4n) as Clockwise90DegreeRotationsFromUpright]);
    orientationsAsBigInt /= 4n;
    return {orientations, orientationsAsBigInt};
  }, {orientations: [] as FaceOrientationLetterTrbl[], orientationsAsBigInt});

  const {digits} = [...Array(25).keys()].reduce( (r) => {
    // Build right to left by reading the number 0-5 from digitsAsBigInt % 6, then dividing by 6
    // for the next most significant value (the digit to the left) 
    let {digits, digitsAsBigInt} = r;
    digits.unshift(FaceDigits[Number(digitsAsBigInt % 6n) as Clockwise90DegreeRotationsFromUpright]);
    digitsAsBigInt /= 6n;
    return {digits, digitsAsBigInt};
  }, {digits: [] as FaceDigit[], digitsAsBigInt});

  const {letterIndexes} = [...Array(25).keys()].reduce( (r, _, index) => {
    // Build right to left by reading the number 0-5 from digitsAsBigInt % 6, then dividing by 6
    // for the next most significant value (the digit to the left) 
    let {letterIndexes, lettersAsBigInt} = r;
    letterIndexes.unshift(Number(lettersAsBigInt % BigInt(index + 1)));
    lettersAsBigInt /= BigInt(index + 1);
    return {letterIndexes, lettersAsBigInt};
  }, {letterIndexes: [] as number[], lettersAsBigInt});

  const {letters} = letterIndexes.reduce( (r, letterIndex) => {
    let {letters, lettersRemaining} = r;
    letters.push(lettersRemaining[letterIndex]);
    lettersRemaining.splice(letterIndex, 1);
    return {letters, lettersRemaining};
  }, {letters: [] as FaceLetter[], lettersRemaining: [...FaceLetters]});

  const faces = DiceKeyFaces([...Array(25).keys()].map( index => ({
    letter: letters[index],
    digit: digits[index],
    orientationAsLowercaseLetterTrbl: orientations[index]
  })));

  return faces;
}


export interface PublicDiceKeyDescriptor {
  readonly centerFaceLetter: FaceLetter;
  readonly centerFaceDigit: FaceDigit;
  readonly keyId: string;
};

abstract class DiceKeyBase {
  constructor(public readonly faces: DiceKeyFaces) {}

  // public abstract withKeyId: Promise<DiceKeyWithKeyId>;
  public abstract rotate: (clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright) => DiceKeyBase;

  get inNumericForm(): bigint | undefined {
    // rotate so that center faces is upright
    const faces: DiceKeyFaces = (() => {
      switch(this.centerFace.orientationAsLowercaseLetterTrbl) {
        case "r": return this.rotate(3);
        case "b": return this.rotate(2);
        case "l": return this.rotate(1);
        default: return this;
    }})().faces;

    const {lettersAsBigInt} = faces.map( ({letter}) => letter )
      .reduce( (r, letter, index) => {
        const letterIndex = r.lettersRemaining.indexOf(letter);
        if (letterIndex >= 0 && r.lettersAsBigInt != null) {
          r.lettersAsBigInt += BigInt(letterIndex) * factorialConstants0to25[24 - index]
          r.lettersRemaining.splice(letterIndex, 1);
        }
        return r;
        }, {lettersAsBigInt: BigInt(0) as bigint | undefined, lettersRemaining: [...FaceLetters]}
      );
    // Fail by returning undefined if there wasn't a unique letter encoding
    if (lettersAsBigInt == null) return lettersAsBigInt;

    let digitsAsBigInt = faces.map( ({digit}) => digit.charCodeAt(0) - "1".charCodeAt(0) )
      .reduce( (prev, digitMinus1is0to5) => prev * BigInt(6) + BigInt(digitMinus1is0to5), BigInt(0) );

    let orientationsAsBigInt = faces.map( ({orientationAsLowercaseLetterTrbl}) =>
      FaceOrientationLetterTrbl.toClockwise90DegreeRotationsFromUpright(orientationAsLowercaseLetterTrbl))
      .reduce( (prev, rotations0to3) => prev * BigInt(4) + BigInt(rotations0to3), BigInt(0) );

    return ( ( (
      lettersAsBigInt
        * digitEncodingSize ) + digitsAsBigInt )
        * uniqueOrientationEncodingSize ) + orientationsAsBigInt;
  }

  get inHumanReadableForm(): DiceKeyInHumanReadableForm { return DiceKeyInHumanReadableForm(this.faces) }
  get centerFace(): Face { return this.faces[12]; }
  get centerLetterAndDigit(): string { return this.centerFace.letter + this.centerFace.digit }
  get nickname(): string { return`DiceKey with ${this.centerLetterAndDigit} in center`; }

  compareTo = <T extends DiceKey>(other: T): DiceKeyComparisonResult<T> =>
  // Compare DiceKey a against the four possible rotations of B to get the list of errors
  ([0, 1, 2, 3] as const)
    .map( clockwiseTurnsFromUpright => {
      const otherDiceKeyRotated = other.rotate(clockwiseTurnsFromUpright) as T;
      const errors = compareDiceKeysAtFixedRotation(this, otherDiceKeyRotated );
      return {clockwiseTurnsFromUpright, errors, otherDiceKeyRotated}
  })
  // Get the shortest list of errors by sorting by the length of the error list
  // (the number of faces with errors) and taking the first element
    .sort( (a, b) => a.errors.length <= b.errors.length ? -1 : 1 )[0];

}

export class DiceKeyWithoutKeyId extends DiceKeyBase {

  private _withKeyId: Promise<DiceKeyWithKeyId> | undefined;
  public get withKeyId(): Promise<DiceKeyWithKeyId> {
    if (this._withKeyId == null) {
      this._withKeyId = ( async () => {return new DiceKeyWithKeyId(await diceKeyFacesToKeyId(this.faces) , this.faces);} )();
    }
    return this._withKeyId;
  }

  static fromRandom = (): DiceKeyWithoutKeyId => new DiceKeyWithoutKeyId(getRandomDiceKey());
  static fromHumanReadableForm = (
    humanReadableForm: DiceKeyInHumanReadableForm,
    validationOptions: DiceKeyValidationOptions = {}
  ): DiceKeyWithoutKeyId => new DiceKeyWithoutKeyId(diceKeyFacesFromHumanReadableForm(humanReadableForm, validationOptions));
  static fromNumericForm = (numericForm: bigint): DiceKeyWithoutKeyId =>
    new DiceKeyWithoutKeyId(facesFromNumericForm(numericForm));

  rotate = (clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright): DiceKeyWithoutKeyId => new DiceKeyWithoutKeyId(rotateDiceKey(this.faces, clockwise90DegreeRotationsFromUpright));
  get inRotationIndependentForm(): DiceKeyWithoutKeyId { return new DiceKeyWithoutKeyId(rotateToRotationIndependentForm(this.faces)) };
  toSeedString = () => diceKeyFacesToSeedString(this.faces);
  rotateToTurnCenterFaceUpright = async (): Promise<DiceKeyWithoutKeyId> => {
    const centerFacesOrientationTrbl = this.faces[12].orientationAsLowercaseLetterTrbl;
    switch (centerFacesOrientationTrbl) {
      case "t": return this;
      case "l": return this.rotate(1);
      case "b": return this.rotate(2);
      case "r": return this.rotate(3);
    }
  }
  
  static testExample = new DiceKeyWithoutKeyId(DiceKeyFaces(
    [...Array(25).keys()].map( (i)  => ({
      letter: FaceLetters[i],
      digit: FaceDigits[i % 6],
      orientationAsLowercaseLetterTrbl: "trbl"[i % 4]
    } as Face ) )
  ));
}

export class DiceKeyWithKeyId extends DiceKeyBase {
  constructor(public readonly keyId: string, faces: DiceKeyFaces) {
    super(faces);
  }

  get withKeyId() { return this }

  // public get withKeyId(): Promise<DiceKeyWithKeyId> {
  //   // wrap this in promise.
  //   return ( async () => {return this} )();
  // }

  static create = async (faces: DiceKeyFaces): Promise<DiceKeyWithKeyId> => {
    const keyId = await diceKeyFacesToKeyId(faces);
    return new DiceKeyWithKeyId(keyId, faces);
  }

  static fromRandom = (): Promise<DiceKeyWithKeyId> => DiceKeyWithKeyId.create(getRandomDiceKey());

  static fromHumanReadableForm = (
    humanReadableForm: DiceKeyInHumanReadableForm,
    validationOptions: DiceKeyValidationOptions = {}
  ): Promise<DiceKeyWithKeyId> => DiceKeyWithKeyId.create(diceKeyFacesFromHumanReadableForm(humanReadableForm, validationOptions));

  static fromNumericForm = (numericForm: bigint): Promise<DiceKeyWithKeyId> =>
    DiceKeyWithKeyId.create(facesFromNumericForm(numericForm));
  
  rotate = (clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright): DiceKeyWithKeyId => new DiceKeyWithKeyId(this.keyId, rotateDiceKey(this.faces, clockwise90DegreeRotationsFromUpright));
  
  get inRotationIndependentForm(): DiceKeyWithKeyId { return new DiceKeyWithKeyId(this.keyId, rotateToRotationIndependentForm(this.faces)) };

  toSeedString = () => diceKeyFacesToSeedString(this.faces);

  rotateToTurnCenterFaceUpright = (): DiceKeyWithKeyId => {
    const centerFacesOrientationTrbl = this.faces[12].orientationAsLowercaseLetterTrbl;
    switch (centerFacesOrientationTrbl) {
      case "t": return this;
      case "l": return this.rotate(1);
      case "b": return this.rotate(2);
      case "r": return this.rotate(3);
    }
  }
  
  publicDescriptor = async (): Promise<PublicDiceKeyDescriptor> => ({
    keyId: this.keyId,
    centerFaceDigit: this.centerFace.digit,
    centerFaceLetter: this.centerFace.letter,
  })

}

export type DiceKey = DiceKeyWithKeyId | DiceKeyWithoutKeyId;

export interface DiceKeyComparisonResult<T extends DiceKey> {
  clockwiseTurnsFromUpright: 0 | 1 | 2 | 3;
  errors: FaceComparisonError[];
  otherDiceKeyRotated: T;
}

