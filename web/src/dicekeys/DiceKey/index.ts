/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Clockwise90DegreeRotationsFromUpright,
} from "@dicekeys/read-dicekey-js";
import { computeLazilyAtMostOnce } from "../../utilities/computeLazilyAtMostOnce";
import {
  Face,
  FaceDigit,
  FaceDigits,
  FaceLetter, FaceLetters,
  FaceOrientationLetterTrbl} from "./Face";
import { DiceKeyFaces, NumberOfFacesInKey } from "./KeyGeometry";
import { DiceKeyValidationOptions } from "./validateDiceKey";
import { getRandomDiceKey } from "./getRandomDiceKey";
import { DiceKeyInHumanReadableForm, diceKeyFacesFromHumanReadableForm } from "./HumanReadableForm";
import { rotateToRotationIndependentForm, rotateDiceKey, rotateToTurnCenterFaceUpright } from "./Rotation";
import { diceKeyFacesToKeyId } from "./KeyIds";
import { factorialConstants0to25, digitEncodingSize, uniqueOrientationEncodingSize, facesFromNumericForm } from "./NumericForm";
import { ShamirShareAsFiniteFieldPoint, facesTooShamirShareFiniteFieldPoint, shamirShareFiniteFieldPointToFaces } from "./asShamirShare";

export * from "./Face";
export * from "./InvalidDiceKeyException";
export * from "./KeyGeometry";
export * from "./validateDiceKey";
export * from "./HumanReadableForm";
export type CenterLetterAndDigit = `${FaceLetter}${FaceDigit}`;




export const EmptyPartialDiceKey = Array.from(Array(25).keys()).map( () => ({}) );

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
    .map( (aFace, index) => compareFaces(aFace, b.faces[index]!, index) )
    .filter( e => e != null ) as FaceComparisonError[];


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
export const diceKeyFacesToSeedString = (
  diceKeyFaces: DiceKeyFaces
): DiceKeyInHumanReadableForm => {
  const canonicalDiceKey = rotateToRotationIndependentForm(diceKeyFaces); 
  const humanReadableForm = DiceKeyInHumanReadableForm(canonicalDiceKey);
  return humanReadableForm;
}

export interface PublicDiceKeyDescriptor {
  readonly centerLetterAndDigit: CenterLetterAndDigit;
  readonly keyId: string;
}

/**
 * Given a public descriptor of a DiceKey containing the center letter and digit,
 * generate a full set of 25 faces to feed to render a DiceKey, replacing the
 * faces we can't obtain from the public descriptor with the center face
 * (oriented upright).
 * @param descriptor A PublicDiceKeyDescriptor containing the letter and digit of the
 * (public) center face of the key.
 * @returns A tuple of 25 faces that aren't the true faces of the DiceKey, but instead 25
 * copies of the center face that can be passed to code that renders DiceKeys.
 */
export const facesFromPublicKeyDescriptor = (descriptor: PublicDiceKeyDescriptor): DiceKeyFaces => {
  const letter = descriptor.centerLetterAndDigit.charAt(0) as FaceLetter;
  const digit = descriptor.centerLetterAndDigit.charAt(1) as FaceDigit;
  const orientationAsLowercaseLetterTrbl = 't';
  const face: Face = {letter, digit, orientationAsLowercaseLetterTrbl};
  return DiceKeyFaces(
    Array.from({ length: NumberOfFacesInKey }, ()=> face)
  );
}

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
          r.lettersAsBigInt += BigInt(letterIndex) * factorialConstants0to25[24 - index]!
          r.lettersRemaining.splice(letterIndex, 1);
        }
        return r;
        }, {lettersAsBigInt: BigInt(0) as bigint | undefined, lettersRemaining: [...FaceLetters]}
      );
    // Fail by returning undefined if there wasn't a unique letter encoding
    if (lettersAsBigInt == null) return lettersAsBigInt;

    const digitsAsBigInt = faces.map( ({digit}) => digit.charCodeAt(0) - "1".charCodeAt(0) )
      .reduce( (prev, digitMinus1is0to5) => prev * BigInt(6) + BigInt(digitMinus1is0to5), BigInt(0) );

    const orientationsAsBigInt = faces.map( ({orientationAsLowercaseLetterTrbl}) =>
      FaceOrientationLetterTrbl.toClockwise90DegreeRotationsFromUpright(orientationAsLowercaseLetterTrbl))
      .reduce( (prev, rotations0to3) => prev * BigInt(4) + BigInt(rotations0to3), BigInt(0) );

    return ( ( (
      lettersAsBigInt
        * digitEncodingSize ) + digitsAsBigInt )
        * uniqueOrientationEncodingSize ) + orientationsAsBigInt;
  }

  toSeedString: () => DiceKeyInHumanReadableForm = computeLazilyAtMostOnce( () => diceKeyFacesToSeedString(this.faces));

  get inHumanReadableForm(): DiceKeyInHumanReadableForm { return DiceKeyInHumanReadableForm(this.faces) }
  get centerFace(): Face { return this.faces[12]; }
  get centerLetterAndDigit(): CenterLetterAndDigit { return `${this.centerFace.letter}${this.centerFace.digit}` }
  get nickname(): string { return`DiceKey with ${this.centerLetterAndDigit} in center`; }

  compareTo = <T extends DiceKey>(other: T): DiceKeyComparisonResult<T> =>
  // Compare DiceKey a against the four possible rotations of B to get the list of errors
  ([0, 1, 2, 3] as const)
    .map( clockwiseTurnsFromUpright => {
      const otherDiceKeyRotated = other.rotate(clockwiseTurnsFromUpright) as T;
      const errors = compareDiceKeysAtFixedRotation(this, otherDiceKeyRotated );
      return {clockwiseTurnsFromUpright, errors, otherDiceKeyRotated};
  })
  // Get the shortest list of errors by sorting by the length of the error list
  // (the number of faces with errors) and taking the first element
    .sort( (a, b) => a.errors.length <= b.errors.length ? -1 : 1 )[0]!;

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

  toShamirShareAsFiniteFieldPoint = (): ShamirShareAsFiniteFieldPoint => facesTooShamirShareFiniteFieldPoint(this.faces);
  static fromShamirShareFiniteFieldPoint = (shamirShareFiniteFieldPoint : ShamirShareAsFiniteFieldPoint) =>
    new DiceKeyWithoutKeyId(shamirShareFiniteFieldPointToFaces(shamirShareFiniteFieldPoint));


  rotate = (clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright): DiceKeyWithoutKeyId => new DiceKeyWithoutKeyId(rotateDiceKey(this.faces, clockwise90DegreeRotationsFromUpright));
  get inRotationIndependentForm(): DiceKeyWithoutKeyId { return new DiceKeyWithoutKeyId(rotateToRotationIndependentForm(this.faces)) }
  rotateToTurnCenterFaceUpright = (): DiceKeyWithoutKeyId => { return new DiceKeyWithoutKeyId(rotateToTurnCenterFaceUpright(this.faces)) }
  
  static readonly testExample = new DiceKeyWithoutKeyId(DiceKeyFaces(
    [...Array(25).keys()].map( (i)  => ({
      letter: FaceLetters[i],
      digit: FaceDigits[i % 6],
      orientationAsLowercaseLetterTrbl: "trbl"[i % 4]
    } as Face ) )
  ));
}

export class DiceKeyWithKeyId extends DiceKeyBase implements PublicDiceKeyDescriptor {
  constructor(public readonly keyId: string, faces: DiceKeyFaces) {
    super(faces);
  }

  get withKeyId() { return this }

  static readonly testExample = new DiceKeyWithKeyId("bogusTestKeyId", DiceKeyWithoutKeyId.testExample.faces);

  // public get withKeyId(): Promise<DiceKeyWithKeyId> {
  //   // wrap this in promise.
  //   return ( async () => {return this} )();
  // }

  static create = async (faces: DiceKeyFaces): Promise<DiceKeyWithKeyId> => {
    const keyId = await diceKeyFacesToKeyId(faces);
    return new DiceKeyWithKeyId(keyId, faces).rotateToTurnCenterFaceUpright();
  }

  static fromRandom = (): Promise<DiceKeyWithKeyId> => DiceKeyWithKeyId.create(getRandomDiceKey());

  static fromHumanReadableForm = (
    humanReadableForm: DiceKeyInHumanReadableForm,
    validationOptions: DiceKeyValidationOptions = {}
  ): Promise<DiceKeyWithKeyId> => DiceKeyWithKeyId.create(diceKeyFacesFromHumanReadableForm(humanReadableForm, validationOptions));

  static fromNumericForm = (numericForm: bigint): Promise<DiceKeyWithKeyId> =>
    DiceKeyWithKeyId.create(facesFromNumericForm(numericForm));
  
  rotate = (clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright): DiceKeyWithKeyId => new DiceKeyWithKeyId(this.keyId, rotateDiceKey(this.faces, clockwise90DegreeRotationsFromUpright));
  
  get inRotationIndependentForm(): DiceKeyWithKeyId { return new DiceKeyWithKeyId(this.keyId, rotateToRotationIndependentForm(this.faces)) }

  toSeedString = (): DiceKeyInHumanReadableForm => diceKeyFacesToSeedString(this.faces);

  static fromShamirShareFiniteFieldPoint = (shamirShareFiniteFieldPoint : ShamirShareAsFiniteFieldPoint) =>
    DiceKeyWithKeyId.create(shamirShareFiniteFieldPointToFaces(shamirShareFiniteFieldPoint));

  rotateToTurnCenterFaceUpright = (): DiceKeyWithKeyId => {
    switch (this.centerFace.orientationAsLowercaseLetterTrbl) {
      case "t": return this;
      case "l": return this.rotate(1);
      case "b": return this.rotate(2);
      case "r": return this.rotate(3);
    }
  }
  
  publicDescriptor = async (): Promise<PublicDiceKeyDescriptor> => ({
    keyId: this.keyId,
    centerLetterAndDigit: this.centerLetterAndDigit
  })

}

export type DiceKey = DiceKeyWithKeyId | DiceKeyWithoutKeyId;

export interface DiceKeyComparisonResult<T extends DiceKey> {
  clockwiseTurnsFromUpright: 0 | 1 | 2 | 3;
  errors: FaceComparisonError[];
  otherDiceKeyRotated: T;
}
