import {
  FaceLetter, FaceDigit,
	Clockwise90DegreeRotationsFromUpright,
	FaceOrientationLetterTrblOrUnknown,
	Face,
} from "./face";
import {
  Undoverline,
  UndoverlineJson,
  Point,
  Line
} from "./undoverline";
import { hammingDistance } from "./bit-operations";

/**
 * Returns the majority value of a, b, c
 * If a != b != c, returns the first value
 * that isn't null or undefined
 */
const majorityOfThree = <T>(
  a: T, b: T, c: T
): T => 
  (b == c) ? b : 
  (a != null) ? a : 
  (b != null) ? b : c;

export class FaceHasTooManyErrorsException extends Error {
  constructor(public faceRead: FaceRead) {
    super(`FaceRead can't be translated to face because errors make determination of letter or digit uncertain.`);
  }
}

export interface FaceReadJson {
	readonly underline: UndoverlineJson | undefined;
	readonly overline: UndoverlineJson | undefined;
	readonly orientationAsLowercaseLetterTRBL: FaceOrientationLetterTrblOrUnknown;
	readonly ocrLetterCharsFromMostToLeastLikely: string;
	readonly ocrDigitCharsFromMostToLeastLikely: string;
	readonly center: Point;
}
  
  export const FaceReadJsonKeys = [
	"underline", "overline",
	"orientationAsLowercaseLetterTRBL",
	"ocrLetterCharsFromMostToLeastLikely", "ocrDigitCharsFromMostToLeastLikely",
	"center"
  ] as const;
  const testFaceReadJsonKeys: readonly (keyof FaceReadJson)[] = FaceReadJsonKeys;
  
  interface UndoverlineBitMismatch {
	type: 'undoverline-bit-mismatch';
	location: "underline" | "overline";
	hammingDistance: number;
  }
  interface UndoverlineMissing {
	type: 'undoverline-missing';
	location: "underline" | "overline"
  }
  interface UndoverlineCharacterWasOcrsSecondChoice {
	type: 'ocr-second-choice';
	location: "letter" | "digit";
  }
  interface UndoverlineCharacterDidNotMatchOcrCharacter {
	type: 'ocr-mismatch';
	location: "letter" | "digit"
  }
  interface NoUndoverlineOrOverlineWithWhichToLocateFace {
	type: 'no-undoverline-or-overline-with-which-to-locate-face'
  }
  interface NoMajorityAgreement {
	type: 'no-majority-agreement';
  }

  export type FaceReadError =
	UndoverlineBitMismatch |
	UndoverlineMissing |
	UndoverlineCharacterWasOcrsSecondChoice |
	UndoverlineCharacterDidNotMatchOcrCharacter |
	NoMajorityAgreement |
	NoUndoverlineOrOverlineWithWhichToLocateFace;  

export class FaceRead implements Partial<Face> {

  public readonly letter: FaceLetter | undefined;
	public readonly digit: FaceDigit | undefined;
	public readonly errors: FaceReadError[] = [];
	public clockwise90DegreeRotationsFromUpright: Clockwise90DegreeRotationsFromUpright;

  constructor(
    public readonly underline: Undoverline | undefined,
    public readonly overline: Undoverline | undefined,
	public orientationAsLowercaseLetterTRBL: FaceOrientationLetterTrblOrUnknown,
    public readonly ocrLetterCharsFromMostToLeastLikely: string,
    public readonly ocrDigitCharsFromMostToLeastLikely: string,
	public readonly center: Point
  ) {
    const ocrLetterRead = ocrLetterCharsFromMostToLeastLikely[0] as FaceLetter | undefined;
		const ocrDigitRead = ocrDigitCharsFromMostToLeastLikely[0] as FaceDigit | undefined;
		if (orientation != null) {
			this.clockwise90DegreeRotationsFromUpright = Clockwise90DegreeRotationsFromUpright(orientation)
		} else {
			this.clockwise90DegreeRotationsFromUpright = 0;
		}
		this.letter = majorityOfThree<FaceLetter | undefined>(
      ocrLetterRead,
      underline == null ? undefined : underline.letter,
      overline == null ? undefined : overline.letter
    );
    this.digit = majorityOfThree<FaceDigit | undefined>(
      ocrDigitRead,
      underline == null ? undefined : underline.digit,
      overline == null ? undefined : overline.digit
    );

		
		/////
		// Populate the errors field
		/////
		if (underline && overline && underline.letter === overline.letter && underline.digit === overline.digit) {
			// The underline and overline map to the same face
			
			// Check for OCR errors for the letter read
			if (underline.letter != ocrLetterRead) {
				this.errors.push({
					location: "letter",
					type: underline.letter === ocrLetterCharsFromMostToLeastLikely[1] ?
						"ocr-second-choice" : "ocr-mismatch"
				})
			}
			if (underline.digit != ocrDigitRead) {
				this.errors.push({
					location: "digit",
					type: underline.digit === ocrDigitCharsFromMostToLeastLikely[1] ?
						"ocr-second-choice" : "ocr-mismatch"
				});
			}
		} else if (underline && underline.letter == ocrLetterRead && underline.digit == ocrDigitRead) {
			// The underline and the OCR-read letter & digit match, so the error is in the overline
			this.errors.push({
				location: "overline",
				...( overline == null ? {
					type: "undoverline-missing",
				} : {
					type: "undoverline-bit-mismatch",
					hammingDistance: hammingDistance(
						underline.faceWithUnoverlineCodes && underline.faceWithUnoverlineCodes.overlineCode || 0,
						overline.code
					)
				})
			});
			
			// All blocks below that could add errors are a result of else clauses, so
			// if we didn't find an OCR error, we're done without finding any errors.

		} else if (overline && overline.letter == ocrLetterRead && overline.digit == ocrDigitRead) {
			// The overline and the OCR-read letter and digit match, any errors are in the underline
			this.errors.push({
				location: "underline",
				...( overline == null ? {
					type: "undoverline-missing",
				} : {
					type: "undoverline-bit-mismatch",
					hammingDistance: hammingDistance(
						overline.faceWithUnoverlineCodes && overline.faceWithUnoverlineCodes.underlineCode || 0,
						overline.code
					)
				})
			});
		} else if (underline == null && underline == null) {
			// If we've made it this far down the if/then/else block, it's possible
			// that neither and underline or overline was read
			this.errors.push({
				type: "no-undoverline-or-overline-with-which-to-locate-face"
			})
    } else {
			// At least an overline OR an underline was read, but we still don't have
			// majority agreement on either a letter, a digit, or both
			this.errors.push({
				type: "no-majority-agreement"
			})
		}

  }

  toFace = () : Face => {
    if (typeof this.letter === "undefined" || typeof this.digit === "undefined") {
      throw new FaceHasTooManyErrorsException(this);
    }
    const {letter, digit, orientationAsLowercaseLetterTRBL} = this;
    return {letter, digit, orientationAsLowercaseLetterTRBL};
  }

  static fromJson = (j: FaceReadJson): FaceRead => new FaceRead(
    Undoverline.fromJsonUnderlineObject(j.underline),
    Undoverline.fromJsonOverlineObject(j.overline),
	  j.orientationAsLowercaseLetterTRBL,
    j.ocrDigitCharsFromMostToLeastLikely,
    j.ocrDigitCharsFromMostToLeastLikely,
  	j.center
  );

}
