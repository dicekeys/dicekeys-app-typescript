
import { action, autorun, makeAutoObservable, runInAction } from "mobx";
import { DiceKeyInFiniteFieldPointFormat, EncodingSpaceOfDiceKeyInFiniteFieldPointFormatYEncodingSpace } from "../../dicekeys/DiceKey/asShamirShare";
import { secretSharingForDiceKeys } from "../../dicekeys/DiceKey/SecretSharingForDiceKeys";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { ViewState } from "../../state/core/ViewState";
import { DiceKey, DiceKeyWithoutKeyId, FaceLetter, FaceLetters, Number0To24, faceLetterToNumber0to24, number0to24ToFaceLetter } from "../../dicekeys/DiceKey";
import { PseudoRandom } from "../../utilities/pseudorandom";

const DefaultSecretCenterLetter: FaceLetter = 'Z';

const getRemainingCenterLetters = (usedLettersNowForbidden: Set<FaceLetter> | Iterable<FaceLetter>, startAt: FaceLetter = 'A') => {
	const usedLettersNowForbiddenSet = usedLettersNowForbidden instanceof Set ? usedLettersNowForbidden : new Set(usedLettersNowForbidden);
	const unusedCenterDieFaceLetters = FaceLetters.filter( i => !usedLettersNowForbiddenSet.has(i) );
	const startOrMinus1 = unusedCenterDieFaceLetters.findIndex( fInt => fInt >= startAt );
	return startOrMinus1 === -1 ? unusedCenterDieFaceLetters :
		[...unusedCenterDieFaceLetters.slice(startOrMinus1), ...unusedCenterDieFaceLetters.slice(0, startOrMinus1)];
}

const SimpleSecretSharingStateName = "SimpleSecretSharingState" as const;
export class SimpleSecretSharingState implements ViewState<typeof SimpleSecretSharingStateName> {
  readonly viewName = SimpleSecretSharingStateName;
  navState: NavigationPathState;

	minSharesToDecode: number;
	setMinSharesToDecode = action( (minSharesToDecode: number) => {this.minSharesToDecode=minSharesToDecode} );
	numSharesToDisplay: number;
	setNumSharesToDisplay = action( (numSharesToDisplay: number) => {this.numSharesToDisplay=numSharesToDisplay} );

	userSpecifiedDiceKeyToSplitIntoShares: DiceKey | undefined;
	secretCenterLetter: FaceLetter = DefaultSecretCenterLetter;
	userProvidedShares: DiceKeyInFiniteFieldPointFormat[];

	random24YValuesForUserSpecifiedDiceKey: bigint[] = [];

	#generate24RandomYValuesForUserSpecifiedDiceKey = () => {
		autorun( () => {
			const userSpecifiedDiceKeyToSplitIntoShares = this.userSpecifiedDiceKeyToSplitIntoShares;
			console.log(`generate24RandomYValuesForUserSpecifiedDiceKey`, userSpecifiedDiceKeyToSplitIntoShares?.inHumanReadableForm);
			if (userSpecifiedDiceKeyToSplitIntoShares == null) {
				runInAction( () => { this.random24YValuesForUserSpecifiedDiceKey = []; });
			} else {
				PseudoRandom.createFromStringSeed(userSpecifiedDiceKeyToSplitIntoShares.inHumanReadableForm).then(
					pRandom => pRandom.getUInts256(24).then( random256BitUnits =>
						runInAction( () => {
							console.log(`writing`, random256BitUnits);
							this.random24YValuesForUserSpecifiedDiceKey =
								random256BitUnits.map( i => BigInt(i) % EncodingSpaceOfDiceKeyInFiniteFieldPointFormatYEncodingSpace );
						})
					)
				)
			}
		});
	}

	startDerivedShareCenterFacesAtLetter: FaceLetter = 'A';
	
	get diceKeyToSplitIntoSharesAsFiniteFieldPoint(): DiceKeyInFiniteFieldPointFormat | undefined {
		if (this.userSpecifiedDiceKeyToSplitIntoShares != null) {
			return this.userSpecifiedDiceKeyToSplitIntoShares.asShamirShareFiniteFieldPoint;
		}
		if (this.userProvidedShares.length >= this.minSharesToDecode) {
			secretSharingForDiceKeys.recoverDiceKeyInFiniteFieldPointFormat(this.secretCenterLetter, this.userProvidedShares, this.minSharesToDecode);
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

	get centerDieLettersOfUserGeneratedShares() {
		return new Set<FaceLetter>( this.userProvidedShares.map( ({x}) => number0to24ToFaceLetter(Number(x) % 25 as Number0To24) ) )
	}

	get pseudoRandomShares() {
		const numSharesToGenerate = Math.min(this.minSharesToDecode - this.userProvidedShares.length, this.random24YValuesForUserSpecifiedDiceKey.length);
		const lettersForSharesRequired = getRemainingCenterLetters(this.centerDieLettersOfUserGeneratedShares, this.startDerivedShareCenterFacesAtLetter)
			.slice(0, numSharesToGenerate);
		return lettersForSharesRequired.map( (letter, i) => {
			const x = BigInt(faceLetterToNumber0to24(letter));
			const y = this.random24YValuesForUserSpecifiedDiceKey[i]!;
			return {x, y} satisfies DiceKeyInFiniteFieldPointFormat;
		})
	}

	get definingShares(): DiceKeyInFiniteFieldPointFormat[] {
		return [
			...this.userProvidedShares,
			...this.pseudoRandomShares
		].slice(0, this.minSharesToDecode);
	}

	// get derivedShareCenterLetters(): FaceLetter[] {
	// 	return getRemainingCenterLetters(
	// 		this.userProvidedShares.map( ({x}) => number0to24ToFaceLetter(Number(x) % 25 as Number0To24) ),
	// 		this.startDerivedShareCenterFacesAtLetter
	// 	).slice(0, this.numSharesToDisplay - this.userProvidedShares.length);
	// }

	get derivedShares(): DiceKeyInFiniteFieldPointFormat[] {
		if (this.definingShares.length < this.minSharesToDecode) return [];
		const derivedShareCenterLetters = getRemainingCenterLetters(
			this.definingShares.map( ({x}) => number0to24ToFaceLetter(Number(x) % 25 as Number0To24) ),
			this.startDerivedShareCenterFacesAtLetter
		).slice(0, this.numSharesToDisplay - this.minSharesToDecode);
		return secretSharingForDiceKeys.generateSharesForLetters(
			this.definingShares,
			derivedShareCenterLetters,
			this.minSharesToDecode
		);
	}

	get derivedDiceKeys(): DiceKeyWithoutKeyId[] {
		return this.derivedShares.map( DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing )
	}

	get sharesAsDiceKeys(): DiceKeyWithoutKeyId[] {
		return [...this.definingShares, ...this.derivedShares].map( DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing )
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
		this.userProvidedShares = [];
		this.userSpecifiedDiceKeyToSplitIntoShares = userSpecifiedDiceKeyToSplitIntoShares;
    makeAutoObservable(this);
		this.#generate24RandomYValuesForUserSpecifiedDiceKey();
  }
}

// Should deterministic shares been generated via a pseudo-random number generator seeded by the secret?