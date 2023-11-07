
import {
	OrientedFace
} from "./Face";
import { validateDiceKey } from "./validateDiceKey";
import { Clockwise90DegreeRotationsFromUpright } from "@dicekeys/read-dicekey-js";

export { Clockwise90DegreeRotationsFromUpright } from "@dicekeys/read-dicekey-js";

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
export type DiceKeyFaces<F extends OrientedFace = OrientedFace> = ReadOnlyTupleOf25Items<F>;
export const DiceKeyFaces = <F extends OrientedFace = OrientedFace>(faces: F[] | DiceKeyFaces<F>, validate: boolean = true) => {
 if (validate) {
	 validateDiceKey(faces, {throwOnFailures: validate});
 }

	return ReadOnlyTupleOf25Items<F>(faces);
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
export type PartialDiceKey = DiceKeyFaces<Mutable<OrientedFace>> | TupleOf25Items<Partial<Mutable<OrientedFace>>>
export const PartialDiceKey = <F extends OrientedFace = OrientedFace>(faces: Partial<F>[] | DiceKeyFaces<F>): TupleOf25Items<Partial<Mutable<F>>> => {
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

export const rotationIndexes5x5: {[rotation in Clockwise90DegreeRotationsFromUpright]: ReadOnlyTupleOf25Items<number>} = {
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