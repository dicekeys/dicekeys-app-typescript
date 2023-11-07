// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { _ } from "core-js";
import { makeAutoObservable, runInAction } from "mobx";
import { DiceKey, DiceKeyFaces, DiceKeyWithKeyId, FaceDigits, FaceLetters, FaceOrientationLettersTrbl, OrientedFace } from "../../dicekeys/DiceKey";
import { english } from "./word-lists/english";

const invertedEnglish: Record<string, number> = english.reduce( (result, word, index) => {
	result[word] = index;
	return result;
}, {} as {[word in string]: number});

/**
 * Convert an array of numbers of width srcBits bits to numbers dstBits bits, zero-padding the end if necessary
 */
const convertArrayBitWidth= (srcBits: number, dstBits: number) => (source: number[]): number[] => {
	let bitsLeftInDestNumber = 0;
	let bitsLeftInSourceNumber = 0;
	const srcNumbersLeft = [...source];
	let srcNumber: number = 0;
	const destNumbers: number[] = [];
	while (true) {
		if (bitsLeftInSourceNumber <= 0) {
			if (srcNumbersLeft.length == 0) {
				return destNumbers;
			}
			srcNumber = srcNumbersLeft.shift() ?? 0;
			bitsLeftInSourceNumber = srcBits;
		}
		if (bitsLeftInDestNumber <= 0) {
			destNumbers.push(0);
			bitsLeftInDestNumber = dstBits;
		}
		const numBitsToCopy = Math.min(bitsLeftInDestNumber, bitsLeftInSourceNumber);
		const bitsLeftInByteSourceNumberCopy = bitsLeftInSourceNumber - numBitsToCopy;
		const bitsLeftInDestNumberAfterCopy = bitsLeftInDestNumber - numBitsToCopy;
		const bitsToCopy =
			// Shift bits right to exclude bits on right that won't be copied
			( srcNumber >> bitsLeftInByteSourceNumberCopy ) & 
			// mask to include only rightmost numBitsToCopy
			((1 << numBitsToCopy) - 1);
		// Copy into numbers
		destNumbers[destNumbers.length - 1] |= (bitsToCopy << bitsLeftInDestNumberAfterCopy);
		// Adjust bit counters
		bitsLeftInSourceNumber = bitsLeftInByteSourceNumberCopy;
		bitsLeftInDestNumber = bitsLeftInDestNumberAfterCopy;
	}
}

const convertArrayOf8BitNumbersTo11BitNumbers = convertArrayBitWidth(8, 11);
const convertArrayOf11BitNumbersTo8BitNumbers = convertArrayBitWidth(11, 8);
const convertArrayOf8BitNumbersTo10BitNumbers = convertArrayBitWidth(8, 10);
const convertArrayOf10BitNumbersTo8BitNumbers = convertArrayBitWidth(10, 8);

export class ChecksumError extends Error {}

const toBip39Array = async (data32Bytes: Uint8ClampedArray): Promise<string[]> => {
	if (data32Bytes.length != 32) {
		throw new Error("Bip39 implementation only supports 32-byte arrays")
	}
	const checksum = new Uint8ClampedArray((await crypto.subtle.digest('SHA-256', data32Bytes)).slice(0, 1) );
	const wordIndexes = convertArrayOf8BitNumbersTo11BitNumbers([...data32Bytes, ...checksum]);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const bip39Array = wordIndexes.map( i => english[i]! );
	return bip39Array;
}
export const toBip39 = async (data32Bytes: Uint8ClampedArray): Promise<string> =>
	(await toBip39Array(data32Bytes)).join(" ");

export class toBip39Calculation{
	value: string = ""
	constructor(data32Bytes: Uint8ClampedArray) {
		makeAutoObservable(this);
		toBip39(data32Bytes).then( s => runInAction( () => { this.value = s } ));
	}
}

const bip39WordsToIndexes = (wordArray: string[]): number[] =>
	wordArray.map( word => {
		const index = invertedEnglish[word.toLocaleLowerCase()]
		if (typeof(index) !== "number") {
			throw new Error("word is not in bip39 english dictionary");
		}
		return index;
	})

const bip39WordsToByteArray = async (wordArray: string[]): Promise<Uint8ClampedArray> => {
		const wordIndexes = bip39WordsToIndexes(wordArray);
	const bytes = new Uint8ClampedArray(convertArrayOf11BitNumbersTo8BitNumbers(wordIndexes));
	if (bytes.length < 33) {
		throw new Error("Invalid length");
	}
	const data32Bytes = bytes.subarray(0,32);
	const checksum = new Uint8ClampedArray(await crypto.subtle.digest('SHA-256', data32Bytes))[0];
	if (checksum !== bytes[32]) {
		throw new ChecksumError("checksum did not match");
	}
	return data32Bytes;
}

const bip39StringToWords = (bip39: string): string[] => bip39
	// Split on any sequence of white space characters (space, tab, CR, LF)
	.split(/[ \t\r\n]+/);

export const bip39ToByteArray = (bip39: string) => bip39WordsToByteArray(bip39StringToWords(bip39));

const fromBip39StringTo10BitNumbers = async (bip39: string): Promise<number[]> =>
convertArrayOf8BitNumbersTo10BitNumbers([...await bip39ToByteArray(bip39)]);

const faceFromNumber0to599 = (faceAs10BitNumber: number): OrientedFace => ({
	letter: FaceLetters[ Math.floor( faceAs10BitNumber / 24 ) ],
	digit: FaceDigits[ (Math.floor( faceAs10BitNumber / 4 ) % 6) ],
	orientationAsLowercaseLetterTrbl: FaceOrientationLettersTrbl[faceAs10BitNumber % 4]
} as OrientedFace );

export const faceToNumber0to599 = (face: OrientedFace): number =>
	(FaceLetters.indexOf(face.letter) * 24) +
	(FaceDigits.indexOf(face.digit) * 4) +
	(FaceOrientationLettersTrbl.indexOf(face.orientationAsLowercaseLetterTrbl));


export const bip39StringToDiceKey = async (bip39: string): Promise<DiceKeyWithKeyId> => {
	const faces = (await fromBip39StringTo10BitNumbers(bip39))
		.slice(0, 25)
		.map( faceFromNumber0to599 );
	return await DiceKeyWithKeyId.create(DiceKeyFaces(faces));
}

export const diceKeyToBip39WordArray = (diceKey: DiceKey): Promise<string[]> =>
	toBip39Array( new Uint8ClampedArray(  convertArrayOf10BitNumbersTo8BitNumbers( diceKey.faces.map( faceToNumber0to599 ) ) ));

export const diceKeyToBip39String = (diceKey: DiceKey): Promise<string> =>
	toBip39( new Uint8ClampedArray(  convertArrayOf10BitNumbersTo8BitNumbers( diceKey.faces.map( faceToNumber0to599 ) ) ));

