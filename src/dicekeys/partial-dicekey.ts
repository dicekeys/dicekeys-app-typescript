import {
  FaceLetter, FaceDigit, FaceOrientationLetterTrbl, Face
} from "@dicekeys/read-dicekey-js";
import { TupleOf25Items } from "./dicekey";
import { Observable } from "~web-component-framework";

export class ObservablePartialFace implements Partial<Face> {
  readonly letterField: Observable<FaceLetter | undefined>;
  readonly digitField: Observable<FaceDigit | undefined>;
  readonly orientationAsLowercaseLetterTrblField: Observable<FaceOrientationLetterTrbl | undefined>;

  get letter() { return this.letterField.value }
  set letter(letter: FaceLetter | undefined) { this.letterField.set(letter) }

  get digit() { return this.digitField.value }
  set digit(digit: FaceDigit | undefined) { this.digitField.set(digit) }

  get orientationAsLowercaseLetterTrbl() { return this.orientationAsLowercaseLetterTrblField.value }
  set orientationAsLowercaseLetterTrbl(orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl | undefined) { this.orientationAsLowercaseLetterTrblField.set(orientationAsLowercaseLetterTrbl) }

  constructor(partialFace: Partial<Face>) {
    this.letterField = new Observable<FaceLetter | undefined>(partialFace.letter);
    this.digitField = new Observable<FaceDigit | undefined>(partialFace.digit);
    const orientationAsLowercaseLetterTrbl = partialFace.orientationAsLowercaseLetterTrbl == "?" ? undefined : partialFace.orientationAsLowercaseLetterTrbl;
    this.orientationAsLowercaseLetterTrblField = new Observable<FaceOrientationLetterTrbl | undefined>(orientationAsLowercaseLetterTrbl);
  }
}

export type ObservablePartialDiceKey = TupleOf25Items<ObservablePartialFace>;