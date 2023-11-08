
import { makeAutoObservable } from "mobx";
import { DiceKeyInFiniteFieldPointFormat, PrimeAtDiceKeyFixedPointMaxPlus30, getUnusedFaceIndexes } from "../../dicekeys/DiceKey/asShamirShare";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { ViewState } from "../../state/core/ViewState";
import { DiceKey, DiceKeyWithoutKeyId, Face, faceLetterAndDigitToNumber0to149, number0to149ToFaceLetterAndDigit } from "../../dicekeys/DiceKey";
import { ShamirSecretSharing } from "../../utilities/ShamirSecretSharing";

const shamirSecretSharingForDiceKeys = new ShamirSecretSharing(PrimeAtDiceKeyFixedPointMaxPlus30);

const DefaultSecretCenterFace: Face = {letter: 'Z', digit: '6'};

const SimpleSecretSharingStateName = "SimpleSecretSharingState" as const;
export class SimpleSecretSharingState implements ViewState<typeof SimpleSecretSharingStateName> {
  readonly viewName = SimpleSecretSharingStateName;
  navState: NavigationPathState;

	minSharesToDecode: number;
	numSharesToDisplay: number;

	userSpecifiedDiceKeyToSplitIntoShares: DiceKey | undefined;
	secretCenterFace: Face = DefaultSecretCenterFace;
	userGeneratedShares: DiceKeyInFiniteFieldPointFormat[];

	get centerDieFaceIndexesOfUserGeneratedShares(): Set<number> {
		return new Set<number>( this.userGeneratedShares.map( ({x}) => Number(x) ) )
	}
	
	get derivedShareCenterFaces(): Face[] {
		return getUnusedFaceIndexes( this.centerDieFaceIndexesOfUserGeneratedShares )
		.slice(0, this.numSharesToDisplay - this.userGeneratedShares.length)
		.map( number0to149ToFaceLetterAndDigit );
	}
	
	get diceKeyToSplitIntoSharesAsFiniteFieldPoint(): DiceKeyInFiniteFieldPointFormat | undefined {
		if (this.userSpecifiedDiceKeyToSplitIntoShares != null) {
			return this.userSpecifiedDiceKeyToSplitIntoShares.asShamirShareFiniteFieldPoint;
		}
		if (this.userGeneratedShares.length >= this.minSharesToDecode) {
			shamirSecretSharingForDiceKeys.recoverSecret(this.userGeneratedShares, BigInt(faceLetterAndDigitToNumber0to149(this.secretCenterFace)), this.minSharesToDecode);
		}
		return;
	}

	get diceKeyToSplitIntoShares(): DiceKey | undefined {
		if (this.userSpecifiedDiceKeyToSplitIntoShares != null) {
			return this.userSpecifiedDiceKeyToSplitIntoShares;
		} else if (this.diceKeyToSplitIntoSharesAsFiniteFieldPoint != null) {
			return DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing(this.diceKeyToSplitIntoSharesAsFiniteFieldPoint);
		}
		return;
	}

	get derivedShares(): DiceKeyInFiniteFieldPointFormat[] {
		const diceKeyAsFiniteFieldPoint = this.diceKeyToSplitIntoSharesAsFiniteFieldPoint;
		if (diceKeyAsFiniteFieldPoint == null) return [];
		return shamirSecretSharingForDiceKeys.generateAdditionalShares(
			[diceKeyAsFiniteFieldPoint,
			 ...this.userGeneratedShares.slice(0, this.minSharesToDecode - 1)],
			this.derivedShareCenterFaces.map( f => BigInt(faceLetterAndDigitToNumber0to149(f) ) ),
			this.minSharesToDecode
		);
	}

	get derivedDiceKeys(): DiceKeyWithoutKeyId[] {
		return this.derivedShares.map( DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing )
	}

  constructor(
    parentNavState: NavigationPathState,
		{
			userSpecifiedDiceKeyToSplitIntoShares,
			minSharesToDecode = 2,
			numSharesToDisplay = minSharesToDecode + 2,
		} : {
			userSpecifiedDiceKeyToSplitIntoShares?: DiceKey,
			minSharesToDecode?: number,
			numSharesToDisplay?: number,
		}
  ) {
    this.navState = new NavigationPathState(parentNavState, SimpleSecretSharingStateName, () => "");
		this.minSharesToDecode = minSharesToDecode;
		this.numSharesToDisplay = numSharesToDisplay;
		this.userGeneratedShares = [];
		this.userSpecifiedDiceKeyToSplitIntoShares = userSpecifiedDiceKeyToSplitIntoShares;
    makeAutoObservable(this);
  }
}

