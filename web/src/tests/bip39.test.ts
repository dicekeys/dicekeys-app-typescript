import { DiceKeyWithoutKeyId } from "../dicekeys/DiceKey";
import { toBip39, bip39ToByteArray, diceKeyToBip39String, bip39StringToDiceKey as bip39ToDiceKey } from "../formats/bip39/bip39";

import { Crypto } from "@peculiar/webcrypto"
import { TestDiceKeys } from "./TestDiceKeys";
global.crypto = new Crypto() as typeof global.crypto;

const testVectorsFromSpec: [string, string][] = [
	[
		"0000000000000000000000000000000000000000000000000000000000000000",
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
	],
	[
		"7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f",
		"legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth title"
	],
	[
		"8080808080808080808080808080808080808080808080808080808080808080",
		"letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic bless"
	],
	[
		"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		"zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote"
	],
	[
		"68a79eaca2324873eacc50cb9c6eca8cc68ea5d936f98787c60c7ebc74e6ce7c",
		"hamster diagram private dutch cause delay private meat slide toddler razor book happy fancy gospel tennis maple dilemma loan word shrug inflict delay length"
	],
	[
		"9f6a2878b2520799a44ef18bc7df394e7061a224d2c33cd015b157d746869863",
		"panda eyebrow bullet gorilla call smoke muffin taste mesh discover soft ostrich alcohol speed nation flash devote level hobby quick inner drive ghost inside"
	],
	[
		"066dca1a2bb7e8a1db2832148ce9933eea0f3ac9548d793112d9a95c9407efad",
		"all hour make first leader extend hole alien behind guard gospel lava path output census museum junior mass reopen famous sing advance salt reform"
	],
	[
		"f585c11aec520db57dd353c69554b21a89b20fb0650966fa0a9d6f74fd989d8f",
		"void come effort suffer camp survey warrior heavy shoot primary clutch crush open amazing screen patrol group space point ten exist slush involve unfold"
	]
];

describe("Formats: Bip39", () => {

  test("Bip39 Spec Test Vectors", async () => {
    for (const [hex32BytesFromTestVector, bip39StringFromVector] of testVectorsFromSpec) {
      const seed32BytesFromTestVector = new Uint8ClampedArray(hex32BytesFromTestVector.match(/.{1,2}/g)!.map( twoHexDigits => parseInt(twoHexDigits, 16)));
      const bip39Generated = await toBip39(seed32BytesFromTestVector)
      expect(bip39Generated).toStrictEqual(bip39StringFromVector);
      const seed32BytesRoundTrip = await bip39ToByteArray(bip39Generated);
      expect(seed32BytesRoundTrip).toStrictEqual(seed32BytesFromTestVector);
    }
  });

  test("Bip39 DiceKey example", async () => {
    const diceKey = DiceKeyWithoutKeyId.testExample;
    const bip39Generated = await diceKeyToBip39String(diceKey)
    const diceKeyRestored = await bip39ToDiceKey(bip39Generated);
    expect(diceKey.rotateToTurnCenterFaceUpright().inHumanReadableForm).toStrictEqual(diceKeyRestored.rotateToTurnCenterFaceUpright().inHumanReadableForm);
  });

	TestDiceKeys.forEach( (diceKey, index) => {
		const inHumanReadableForm = diceKey.rotateToTurnCenterFaceUpright().inHumanReadableForm;
    test(`Bip39 DiceKeys: ${inHumanReadableForm}  (${index})`, async () => {
      const bip39Generated = await diceKeyToBip39String(diceKey)
      const diceKeyRestored = await bip39ToDiceKey(bip39Generated);
      expect(diceKeyRestored.inHumanReadableForm).toStrictEqual(inHumanReadableForm);
    });
  });
});
