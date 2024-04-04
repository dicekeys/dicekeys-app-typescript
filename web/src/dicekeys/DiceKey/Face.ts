import type {
	FaceDigit,
	FaceIdentifiers,
	FaceLetter,
	FaceOrientation,
	FaceOrientationLetterTrbl,
} from "@dicekeys/read-dicekey-js";
import {
	FaceDigits,
	FaceLetters,
	FaceOrientationLettersTrbl
} from "@dicekeys/read-dicekey-js";
import { Clockwise90DegreeRotationsFromUpright, NumberOfFacesInKey } from "./KeyGeometry";
import { rangeStartingAt0 } from "../../utilities/range";
export {
	FaceDigit, FaceDigits, FaceLetter, FaceLetters, FaceOrientationLetterTrbl, FaceOrientationLetterTrblOrUnknown, FaceOrientationLettersTrbl, InvalidFaceDigitException, InvalidFaceLetterException, InvalidFaceOrientationLettersTrblOrUnknownException
} from "@dicekeys/read-dicekey-js";

export interface Face extends FaceIdentifiers {
	readonly letter: FaceLetter;
	readonly digit: FaceDigit;
};
export interface OrientedFace extends Face, FaceOrientation {
	readonly orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl
}

export type FaceLetterAndDigit = `${FaceLetter}${FaceDigit}`;

export type Number0To5 = 0 | 1 | 2 | 3 | 4 | 5;
export type Number0To24 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;
export type Number0To149 = number;
export const NumberOfPossibleFaces = 150; // 6 * 25

export const faceLetterToNumber0to24 = (faceLetter: FaceLetter) => FaceLetters.indexOf(faceLetter) as Number0To24;
export const number0to24ToFaceLetter = (number0to24: Number0To24) => FaceLetters[number0to24];

export const faceDigitToNumber0to5 = (faceDigit: FaceDigit) => FaceDigits.indexOf(faceDigit) as Number0To5;
export const number0to5ToFaceDigit = (number0to5: Number0To5) => FaceDigits[number0to5];

/**
 * Encode an array of FaceDigits as a bigint, with each face representing a base6 digits (0-5),
 * encoded with the first (leftmost) digit as the highest-order value.
 * @param faceDigits An array of digits '1'-'6'
 * @returns A bigint with each face representing a base6 digits (0-5),
 * encoded with the first (leftmost) digit as the highest-order value.
 */
export const faceDigitsToBigInt = (faceDigits: FaceDigit[]): bigint => faceDigits.reduce(
	(asBigInt, faceDigit) => (asBigInt * 6n) + BigInt(faceDigitToNumber0to5(faceDigit)),
	0n
);
// export const facesToBigIntForAllDigits = (faces: Face[]): bigint =>
// 	faceDigitsToBigInt( faces.map( face => face.digit ) );

/**
 * Extract arrays of FaceDigits ('1'-'6') from a bigint format that encodes them as in base 6
 * with the first digit array as the highest-order value.
 * 
 * The inverse of faceDigitsToBigInt
 * @param bigIntForAllDigits 
 * @param count 
 * @returns 
 */
export const bigIntForAllDigitsToFaceDigits = (bigIntForAllDigits: bigint, count: number) =>
	// decode rightmost (lowest order) first, appending new digits to the start of the array.
	rangeStartingAt0(count).map( () => {
		const lowestOrderDigit = Number(bigIntForAllDigits % 6n) as Number0To5;
		const faceDigit = number0to5ToFaceDigit(lowestOrderDigit);
		bigIntForAllDigits /= 6n;
		return faceDigit;
	}).reverse();


export const faceOrientationTrblTo0To3Clockwise90RotationsFromUpright = (faceOrientationTrbl: FaceOrientationLetterTrbl) =>
	FaceOrientationLettersTrbl.indexOf(faceOrientationTrbl) as Clockwise90DegreeRotationsFromUpright;
export const clockwise90DegreeRotationsToTrbl =
	(number0To3: Clockwise90DegreeRotationsFromUpright) => FaceOrientationLettersTrbl[number0To3];

export const faceOrientationTrblToBigInt = (faceOrientationTrbl: FaceOrientationLetterTrbl[]): bigint => faceOrientationTrbl.reduce(
	(asBigInt, faceOrientationTrbl) => (asBigInt * 4n) + BigInt(faceOrientationTrblTo0To3Clockwise90RotationsFromUpright(faceOrientationTrbl)),
	0n
);
export const facesToBigIntForAllOrientations = (faces: OrientedFace[]): bigint =>
	faceOrientationTrblToBigInt( faces.map( face => face.orientationAsLowercaseLetterTrbl ) );
export const bigIntForAllOrientationsToFaceOrientations = (bitIntForAllOrientations: bigint, count: number) =>
	rangeStartingAt0(count).reduce( (orientations) => {
		orientations.unshift(clockwise90DegreeRotationsToTrbl(Number(bitIntForAllOrientations % 4n) as Clockwise90DegreeRotationsFromUpright));
		bitIntForAllOrientations /= 4n; 
		return orientations;
	}, [] as FaceOrientationLetterTrbl[]);

/**
 * Encodes the first letter index in the highest-order value and the choice between the last two as a
 * single bit 0/1
 * @param letters 
 * @param excludeSet 
 * @returns 
 */
export const uniqueFaceLettersToBigInt = (letters: FaceLetter[], excludeSet: Set<FaceLetter> = new Set<FaceLetter>()) => {
	if (new Set(letters).size != letters.length) {
		throw new RangeError(`Letters must be unique ${letters.join(",")}`)
	}
	if (letters.length + excludeSet.size != NumberOfFacesInKey) {
		throw new RangeError(`Must include ${NumberOfFacesInKey} letters in letters array combined with the exclude set.`)
	}
	const validLetters = FaceLetters.filter( l => !excludeSet.has(l) );
	const letterIndexes = letters.reduce( (letterIndexesInProgress, letter) => {
			const letterIndex = validLetters.indexOf(letter);
			validLetters.splice(letterIndex, 1);
			letterIndexesInProgress.push(letterIndex);
			return letterIndexesInProgress;
		},
		[] as number[]
	);
	return letterIndexes.reduce( (asBigInt, letterIndex, i) =>
			( asBigInt * BigInt(letterIndexes.length - i) ) + BigInt(letterIndex)
		, 0n);
}
export const bigIntToUniqueFaceLetters = (uniqueLettersAsBigInt: bigint, excludeSet: Set<FaceLetter> = new Set<FaceLetter>()): FaceLetter[] => {
	const validLetters = FaceLetters.filter( l => !excludeSet.has(l) );
	// construct indexes right to left
	const letterIndexes = validLetters.reduce( (letterIndexesInProgress, _, i) => {
		const divisor = BigInt(i + 1);
		letterIndexesInProgress.unshift( Number(uniqueLettersAsBigInt % divisor) );
		uniqueLettersAsBigInt /= divisor;
		return letterIndexesInProgress;
	} , [] as number[]);
	const letters: FaceLetter[] = letterIndexes.map( letterIndex =>
		validLetters.splice(letterIndex, 1)[0]!
	)
	return letters;
}




export const faceLetterAndDigitToNumber0to149 = (face: Face) => (faceLetterToNumber0to24(face.letter) * 6) + faceDigitToNumber0to5(face.digit);

export const number0to149ToFaceLetterAndDigit = (number0to149: number): Face => ({
	digit: number0to5ToFaceDigit(number0to149 % 6 as Number0To5),
	letter: number0to24ToFaceLetter(Math.floor(number0to149 / 6) % 25 as Number0To24),
});

export const faceLetterDigitAndOrientationToNumber0to599 = (face: OrientedFace) => (faceOrientationTrblTo0To3Clockwise90RotationsFromUpright(face.orientationAsLowercaseLetterTrbl) * 150) +
	faceLetterAndDigitToNumber0to149(face);
export const number0to599ToFaceLetterDigitAndOrientation = (number0to599: number): OrientedFace => ({
	...number0to149ToFaceLetterAndDigit(number0to599 % 150),
	orientationAsLowercaseLetterTrbl: clockwise90DegreeRotationsToTrbl(Math.floor(number0to599 / 150) % 4 as Clockwise90DegreeRotationsFromUpright)
});
