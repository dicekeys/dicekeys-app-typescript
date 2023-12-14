import { DiceKeyWithoutKeyId } from "../dicekeys/DiceKey";

import { TestDiceKeys } from "./TestDiceKeys";

// FUTURE: Remove 7 following lines after moving to Node 19+
import { webcrypto } from 'node:crypto';
if (!globalThis?.crypto?.subtle) {
	if ("crypto" in globalThis) {
		Object.assign(globalThis.crypto, {subtle: webcrypto.subtle});
	} else {
		globalThis.crypto = {subtle: webcrypto.subtle} as typeof globalThis["crypto"];
	}
}


describe("Formats: Bip39", () => {

  describe("Human readable form", () => {
    TestDiceKeys.forEach( (diceKey, testIndex) => {
      const {inHumanReadableForm} = diceKey;
      test(`${inHumanReadableForm} (${testIndex})`, () => {
        const replica = DiceKeyWithoutKeyId.fromHumanReadableForm(inHumanReadableForm, {requireOneOfEachLetter: true, throwOnFailures: true});
        const equal = Array.from(Array(25).keys()).every( index => 
          replica.faces[index]?.digit === diceKey.faces[index]?.digit &&
          replica.faces[index]?.letter === diceKey.faces[index]?.letter &&
          replica.faces[index]?.orientationAsLowercaseLetterTrbl === diceKey.faces[index]?.orientationAsLowercaseLetterTrbl
        );
        expect(equal).toStrictEqual(true);
      });
    });
  });

  describe("Numeric form", () => {
    TestDiceKeys.forEach( (diceKey, testIndex) => {
      test(`${diceKey.inHumanReadableForm} (${testIndex})`, () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const replica = DiceKeyWithoutKeyId.fromNumericForm(diceKey.inNumericForm!);
        expect(replica.inHumanReadableForm).toStrictEqual(replica.inHumanReadableForm);
      });
    });
  });


  describe("Shamir share form", () => {
    TestDiceKeys.forEach( (diceKey, testIndex) => {
      test(`${diceKey.inHumanReadableForm} (${testIndex})`, () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const shamirForm = diceKey.asShamirShareFiniteFieldPoint;
        const replica = DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing(shamirForm!);
        expect(replica.inHumanReadableForm).toStrictEqual(diceKey.rotateToTurnCenterFaceUpright().inHumanReadableForm);
      });
    });
  });


  
});
