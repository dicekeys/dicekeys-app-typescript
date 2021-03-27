import {english} from "./word-lists/english";

const invertedEnglish: {[word in string]: number} = english.reduce( (result, word, index) => {
	result[word] = index;
	return result;
}, {} as {[word in string]: number});

const adjustBitSize= (srcBits: number, dstBits: number) => (source: number[]): number[] => {
	let bitsLeftInDestNumber = 0;
	let bitsLeftInSourceNumber = 0;
	let srcNumbersLeft = [...source];
	let srcNumber: number = 0;
	const destNumbers: number[] = [];
	while (true) {
		if (bitsLeftInDestNumber <= 0) {
			destNumbers.push(0);
			bitsLeftInDestNumber = dstBits;
		}
		if (bitsLeftInSourceNumber <= 0) {
			if (srcNumbersLeft.length == 0) {
				return destNumbers;
			}
			srcNumber = srcNumbersLeft.shift()!;
			bitsLeftInSourceNumber = srcBits;
		}
		const numBitsToCopy = Math.min(bitsLeftInDestNumber, bitsLeftInSourceNumber);
		const bitsLeftInByteAfterCopy = bitsLeftInSourceNumber - numBitsToCopy;
		const bitsLeftInNumberAfterCopy = bitsLeftInDestNumber - numBitsToCopy;
		const bitsToCopy =
			// Shift bits right to exclude bits on right that won't be copied
			( srcNumber >> bitsLeftInByteAfterCopy ) & 
			// mask to include only rightmost numBitsToCopy
			((1 << numBitsToCopy) - 1);
		// Copy into numbers
		destNumbers[destNumbers.lastIndex] |= (bitsToCopy << bitsLeftInNumberAfterCopy);
	}
}

const adjustBitSize8to11 = adjustBitSize(8, 11);
const adjustBitSize11to8 = adjustBitSize(11, 8);
const uint8ClampedArrayToArrayOf11BitNumbers = (srcArray: Uint8ClampedArray): number[] => adjustBitSize8to11([...srcArray]);
const arrayOf11BitNumbersToUint8ClampedArray = (srcArray: number[]): Uint8ClampedArray => new Uint8ClampedArray(adjustBitSize11to8([...srcArray]));

export class ChecksumError extends Error {}

export const toBip39Array = async (data32Bytes: Uint8ClampedArray): Promise<string[]> => {
	if (data32Bytes.length != 32) {
		// FIXME throw.
		return [];
	}
	const checksum = new Uint8ClampedArray((await crypto.subtle.digest('SHA-256', data32Bytes)).slice(0, 1) );
	const wordIndexes = uint8ClampedArrayToArrayOf11BitNumbers(Uint8ClampedArray.from([...data32Bytes, ...checksum]));
	const bip39Array = wordIndexes.map( i => english[i] );
	return bip39Array;
}
export const toBip39StringSpacedSeparated = async (data32Bytes: Uint8ClampedArray): Promise<string> =>
	(await toBip39Array(data32Bytes)).join(" ");

export const bip39WordsToIndexes = (wordArray: string[]): number[] =>
	wordArray.map( word => {
		const index = invertedEnglish[word.toLocaleLowerCase()]
		if (typeof(index) !== "number") {
			throw new Error("word is not in bip39 english dictionary");
		}
		return index;
	})
export const bip39WordsToByteArray = async (wordArray: string[]): Promise<Uint8ClampedArray> => {
	const wordIndexes = bip39WordsToIndexes(wordArray);
	const bytes = arrayOf11BitNumbersToUint8ClampedArray(wordIndexes);
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
