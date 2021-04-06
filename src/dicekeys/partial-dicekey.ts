// import {
//   FaceLetter, FaceDigit, FaceOrientationLetterTrbl, Face
// } from "@dicekeys/read-dicekey-js";
// import { makeAutoObservable } from "mobx";
// import { TupleOf25Items } from "./dicekey";

// export class ObservablePartialFace implements Partial<Face> {
//   readonly letter: FaceLetter | undefined;
//   readonly digit: FaceDigit | undefined;
//   readonly orientationAsLowercaseLetterTrblField: FaceOrientationLetterTrbl | undefined;

//   get letter() { return this.letterField.value }
//   set letter(letter: FaceLetter | undefined) { this.letterField.set(letter) }

//   get digit() { return this.digitField.value }
//   set digit(digit: FaceDigit | undefined) { this.digitField.set(digit) }

//   get orientationAsLowercaseLetterTrbl() { return this.orientationAsLowercaseLetterTrblField.value }
//   set orientationAsLowercaseLetterTrbl(orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl | undefined) { this.orientationAsLowercaseLetterTrblField.set(orientationAsLowercaseLetterTrbl) }

//   constructor(partialFace: Partial<Face>) {
//     this.letterField = new FaceLetter | undefined>(partialFace.letter);
//     this.digitField = new FaceDigit | undefined>(partialFace.digit);
//     const orientationAsLowercaseLetterTrbl = partialFace.orientationAsLowercaseLetterTrbl == "?" ? undefined : partialFace.orientationAsLowercaseLetterTrbl;
//     this.orientationAsLowercaseLetterTrblField = new FaceOrientationLetterTrbl | undefined>(orientationAsLowercaseLetterTrbl);
//     makeAutoObservable(this);
//   }
// }

// export type ObservablePartialDiceKey = TupleOf25Items<ObservablePartialFace>;