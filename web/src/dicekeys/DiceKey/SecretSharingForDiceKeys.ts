import { ShamirSecretSharing } from "../../utilities/ShamirSecretSharing";
import { FaceLetter, faceLetterToNumber0to24 } from "./Face";
import { DiceKeyInFiniteFieldPointFormat } from "./asShamirShare";

// export const PrimeAtDiceKeyCombinationsWithCenterDieFixedAndUprightPlus30 = 827514231081199274682194003812398710017109379105423360029n as bigint;

/**
 * // factorial(24)*6^25*4^24 = 4965085386487195648093164022874392260102656274632540160000 
 *  nearest greater prime is 4965085386487195648093164022874392260102656274632540160000 + 107

 */
export const KeySpaceForDiceKeyWithCenterUprightAndLetterFixedPlus107ToReachNearestPrime = 4965085386487195648093164022874392260102656274632540160107n;


class SecretSharingForDiceKeys extends ShamirSecretSharing<bigint> {

  constructor() {
    super(KeySpaceForDiceKeyWithCenterUprightAndLetterFixedPlus107ToReachNearestPrime);
  }

  recoverDiceKeyInFiniteFieldPointFormat = (
    centerFaceLetterOfSecret: FaceLetter | bigint,
    fromShares: DiceKeyInFiniteFieldPointFormat[],
    minimumNumberOfSharesToRecover?: number
  ): DiceKeyInFiniteFieldPointFormat => {
    const x = typeof centerFaceLetterOfSecret === "string" ? BigInt(faceLetterToNumber0to24(centerFaceLetterOfSecret)) : centerFaceLetterOfSecret;
    const y = this.recoverSecret(
      fromShares,
      x,
      minimumNumberOfSharesToRecover
    );
    return {x, y};
  };

  generateSharesForLetters = (
		existingShares: DiceKeyInFiniteFieldPointFormat[],
		centerDieLettersForNewShares: FaceLetter[],
		minimumNumberOfSharesToRecover: number
	): DiceKeyInFiniteFieldPointFormat[] =>
    this.generateAdditionalShares(
      existingShares,
      centerDieLettersForNewShares.map( letter => BigInt(faceLetterToNumber0to24(letter)) ),
      minimumNumberOfSharesToRecover
    )

}
export const secretSharingForDiceKeys = new SecretSharingForDiceKeys();
