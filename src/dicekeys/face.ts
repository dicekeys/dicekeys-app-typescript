/******************************************** 
 * FaceLetter
 ********************************************
 * An array of the 25 unique letters used to identify each die.
 */
export const FaceLetters = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","R","S","T","U","V","W","X","Y","Z"
] as const;

/**
 * A type that represents only those characters that are among the
 * 25 letters used to uniquely identify each element.
 */
export type FaceLetter = typeof FaceLetters[number];

const ValidFaceLetters = new Set<string>(FaceLetters);

export class InvalidFaceLetterException extends Error {
  public readonly letter: string | undefined;
  public readonly position?: number;
  constructor(letter: string | undefined, {position}: {position?: number} = {}) {
    super(`${letter} is not a valid die letter${ position == null ? "" : ` at position ${position}`}.`)
    this.letter = letter;
    this.position = position;
  }
}

/**
 * Coerce a string to a FaceLetter, throwing an exception if the string is not a valid die letter.
 * @param letter The string which should contain an element letter
 * @param param1 Optional objected used to pass a position with a KeySqr for exception reporting
 */
export const FaceLetter = (
  letter: string,
  {position}: {position?: number} = {}
): FaceLetter => {
  if (!ValidFaceLetters.has(letter))
    throw new InvalidFaceLetterException(letter, {position});
  return letter as FaceLetter;
};
FaceLetter.isValid = (couldBeLetter: string | undefined): couldBeLetter is FaceLetter =>
  couldBeLetter != null && ValidFaceLetters.has(couldBeLetter);


/******************************************** 
 * FaceDigit
 ********************************************/
export class InvalidFaceDigitException extends Error {
  public readonly digit: string | number | undefined;
  public readonly position?: number;
  constructor(digit: string | number | undefined, {position}: {position?: number} = {}) {
    super(`${digit} (${typeof digit}) is not a valid element digit${ position == null ? "" : ` at position ${position}`}.`)
    this.digit = digit;
    this.position = position;
  }
}
  
export const FaceDigits = ["1", "2", "3", "4", "5", "6"] as const;
export type FaceDigit = typeof FaceDigits[number];
const ValidFaceDigits = new Set<string>(FaceDigits);
export const FaceDigit = (
  digitOrDigitString: number | string,
  {position}: {position?: number} = {}  
): FaceDigit => {
  const faceDigitString =
    ( typeof(digitOrDigitString) === "number" ) ?
      digitOrDigitString.toString() :
      digitOrDigitString;
  if (!ValidFaceDigits.has(faceDigitString)) {
    throw new InvalidFaceDigitException(digitOrDigitString, {position});
  }
  return faceDigitString as FaceDigit;
}
FaceDigit.isValid = (candidate: string | undefined): candidate is FaceDigit =>
  candidate != null && ValidFaceDigits.has(candidate);    


/******************************************** 
 * Clockwise90DegreeRotationsFromUpright and FaceRotationLetter
 ********************************************/

export class InvalidFaceRotationException extends Error {
  public readonly rotation: string | number | undefined;
  public readonly position?: number;
  constructor(rotation: string | number | undefined, {position}: {position?: number} = {}) {
    super(`${rotation} is not a valid element rotation ${
      ((typeof rotation) === "number") ?
        `(0, 1, 2, 3)` :
        `string ("t", "r", "b", or "l")`
      }${
        position == null ?
          "" :
          ` at position ${position}`
      }.`
    );
    this.rotation = rotation;
    this.position = position;
  }
}

export type Clockwise90DegreeRotationsFromUpright = 0 | 1 | 2 | 3;

export const FaceOrientationLettersTrbl = ["t" , "r" , "b" , "l"] as const;
export type FaceOrientationLetterTrbl = typeof FaceOrientationLettersTrbl[number];
export const ValidFaceOrientationLetterTrbl = new Set<string>(FaceOrientationLettersTrbl);
const isFaceOrientationLetterTrbl = (c: any): c is FaceOrientationLetterTrbl =>
  ValidFaceOrientationLetterTrbl.has(c);
export class InvalidFaceOrientationLettersTrblException extends Error {
  constructor(public orientationAsLowercaseLetterTRBL: any, {position}: {position?: number} = {}) {
    super(`${orientationAsLowercaseLetterTRBL} is not a valid die oreintation${ position == null ? "" : ` at position ${position}`}.`)
  }
}
export const FaceOrientationLetterTrbl = (
  faceOrientationLetterTrbl: string, position: {position?: number} = {}
): FaceOrientationLetterTrbl => {
  if (!isFaceOrientationLetterTrbl(faceOrientationLetterTrbl)) {
    throw new InvalidFaceOrientationLettersTrblException(faceOrientationLetterTrbl, position);
  }
  return faceOrientationLetterTrbl;
}
FaceOrientationLetterTrbl.isValid = isFaceOrientationLetterTrbl;
FaceOrientationLetterTrbl.toClockwise90DegreeRotationsFromUpright = (faceOrientationLetterTrbl: FaceOrientationLetterTrbl): Clockwise90DegreeRotationsFromUpright =>
  ( ( 
    ( ( FaceOrientationLettersTrbl.indexOf(faceOrientationLetterTrbl) ) % 4 )
    + 4) % 4 // ensure mod is positive even if using negtive rotations
  ) as Clockwise90DegreeRotationsFromUpright

export type FaceOrientationLetterTrblOrUnknown = FaceOrientationLetterTrbl | "?";
export const FaceOrientationLettersTrblOrUnknown = [...FaceOrientationLettersTrbl, "?"] as FaceOrientationLetterTrblOrUnknown[];
export const ValidFaceOrientationLetterTrblOrUknown = new Set<string>(FaceOrientationLettersTrblOrUnknown);
const isFaceOrientationLetterTrblOrUnknown = (c: any): c is FaceOrientationLetterTrblOrUnknown =>
  ValidFaceOrientationLetterTrblOrUknown.has(c);
export class InvalidFaceOrientationLettersTrblOrUnknownException extends Error {
  constructor(public orientationAsLowercaseLetterTRBL: any, {position}: {position?: number} = {}) {
    super(`${orientationAsLowercaseLetterTRBL} is not a valid die oreintation${ position == null ? "" : ` at position ${position}`}.`)
  }
};
export const FaceOrientationLetterTrblOrUnknown = (
  faceOrientationLetterTrblOrUnknown: string, position: {position?: number} = {}
): FaceOrientationLetterTrblOrUnknown => {
  if (!isFaceOrientationLetterTrblOrUnknown(faceOrientationLetterTrblOrUnknown)) {
    throw new InvalidFaceOrientationLettersTrblOrUnknownException(faceOrientationLetterTrblOrUnknown, position);
  }
  return faceOrientationLetterTrblOrUnknown;
}
FaceOrientationLetterTrblOrUnknown.isValid = isFaceOrientationLetterTrblOrUnknown;

FaceOrientationLetterTrblOrUnknown.rotate = (
  faceOrientationLetterTrblOrUnknown: FaceOrientationLetterTrblOrUnknown,
  clockwise90DegreeRotations: number
) => (!isFaceOrientationLetterTrbl(faceOrientationLetterTrblOrUnknown)) ? '?' :
  FaceOrientationLettersTrbl[ ( (
      ( FaceOrientationLettersTrbl.indexOf(faceOrientationLetterTrblOrUnknown) + clockwise90DegreeRotations ) % 4 
    ) + 4) % 4  // ensure mod is positive even if using negtive rotations
  ];



export const FaceRotationLetterToClockwise90DegreeRotationsFromUpright = new Map<string, Clockwise90DegreeRotationsFromUpright>(
  FaceOrientationLettersTrbl.map( (letter, index) => [letter, index] as [FaceOrientationLetterTrbl, Clockwise90DegreeRotationsFromUpright] )
);

export const FaceRotationLetterToClockwise90DegreeAngle = new Map<string, number>(
  FaceOrientationLettersTrbl.map( (letter, index) => [letter, 90 * index] as [string, number] )
);
export const faceRotationLetterToClockwiseAngle = (letter: string): number =>
  FaceRotationLetterToClockwise90DegreeAngle.has(letter) ?
    (FaceRotationLetterToClockwise90DegreeAngle.get(letter) as number) : 0;


/**
 * Coerce a string or digit into an Clockwise90DegreeRotationsFromUpright
 * @param digit The number or string representing a rotation.
 * @param param1 Optional objected used to pass a position with a KeySqr for exception reporting
 */
export const Clockwise90DegreeRotationsFromUpright = (
  rotation: string | number,
  {position}: {position?: number} = {}
): Clockwise90DegreeRotationsFromUpright => {
  if (typeof rotation === "number") {
    if (rotation !== 0 && rotation % 90 === 0) {
      rotation = rotation / 90;
    }
    rotation = rotation % 4;
    return rotation as Clockwise90DegreeRotationsFromUpright;
  }
  if (!FaceRotationLetterToClockwise90DegreeRotationsFromUpright.has(rotation)) {
    throw new InvalidFaceRotationException(rotation, {position});
  }
  return FaceRotationLetterToClockwise90DegreeRotationsFromUpright.get(rotation) as Clockwise90DegreeRotationsFromUpright;
}
Clockwise90DegreeRotationsFromUpright.isValid = (candidate: any): candidate is Clockwise90DegreeRotationsFromUpright =>
  typeof(candidate) === "number" && candidate >= 0 && candidate <= 3;


/**
 * The face of an element contains both the letter that is unique to the element and a digit
 * that is unique to the face (each of the six faces, or sides, has a different digit
 * from 1-6).
 */
export interface FaceIdentifiers {
  digit: FaceDigit;
  letter: FaceLetter;
}

/**
 * When an element is placed into a box, a single face (digit) is exposed and
 * it may be upright, facing right (one 90 degree turn from pright), upside-down
 * (two turns), or facing left (3 turns)
 */
export interface FaceOrientation {
  orientationAsLowercaseLetterTRBL: FaceOrientationLetterTrblOrUnknown;
}
export interface Face extends FaceIdentifiers, FaceOrientation {
}
