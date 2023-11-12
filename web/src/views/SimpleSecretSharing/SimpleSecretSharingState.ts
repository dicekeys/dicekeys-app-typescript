
import { action, autorun, makeAutoObservable } from "mobx";
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
	userProvidedShares: DiceKeyInFiniteFieldPointFormat[] = [];
	get userProvidedSharesSorted() {
		return [...this.userProvidedShares].sort( (a, b) => Number(a.x) - Number(b.x) );
	}

	pseudoRandom24YValuesDerivedFromUserSpecifiedDiceKey: bigint[] = [];
	setPseudoRandom24YValuesDerivedFromUserSpecifiedDiceKey = action( (arrayOf24PseudoRandomBigInts: bigint[]) => {
		this.pseudoRandom24YValuesDerivedFromUserSpecifiedDiceKey = arrayOf24PseudoRandomBigInts;
	});

	#generate24RandomYValuesForUserSpecifiedDiceKey = () => {
		autorun( () => {
			const userSpecifiedDiceKeyToSplitIntoShares = this.userSpecifiedDiceKeyToSplitIntoShares;
			if (userSpecifiedDiceKeyToSplitIntoShares == null) {
				this.setPseudoRandom24YValuesDerivedFromUserSpecifiedDiceKey([]);
			} else {
				PseudoRandom.createFromStringSeed(userSpecifiedDiceKeyToSplitIntoShares.inHumanReadableForm).then(
					pRandom => pRandom.getUInts256(24, EncodingSpaceOfDiceKeyInFiniteFieldPointFormatYEncodingSpace).then( random24YValuesFromUserSpecifiedDiceKey =>
						this.setPseudoRandom24YValuesDerivedFromUserSpecifiedDiceKey(random24YValuesFromUserSpecifiedDiceKey)
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
		if (this.userProvidedSharesSorted.length >= this.minSharesToDecode) {
			secretSharingForDiceKeys.recoverDiceKeyInFiniteFieldPointFormat(this.secretCenterLetter, this.userProvidedSharesSorted, this.minSharesToDecode);
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


	/**
	 * If the user HAS NOT provided a DiceKey (secret) to split into share, use minSharesToDecode total shares
	 * (combining any userProvidedShares with pseudoRandomShares) to define the secret (DiceKey) to be shared.
	 * and the next share (minSharesToDecode) will complete the minimal set of shares needed to decode the secret.
	 * 
	 * If the user HAS provided a DiceKey (secret) to split into shares, use minSharesToDecode - 1 total shares
	 * (combining any userProvidedShares with pseudoRandomShares) to define the secret (DiceKey) to be shared.
	 */
	get pseudoRandomShares() {
		const numberOfUserDefinedShares = this.userProvidedShares.length + ( this.userSpecifiedDiceKeyToSplitIntoShares == null ? 0 : 1 );
		const numSharesToGenerate = Math.min(
			this.minSharesToDecode - numberOfUserDefinedShares,
			this.pseudoRandom24YValuesDerivedFromUserSpecifiedDiceKey.length
		);
		if (numSharesToGenerate <= 0) return [];
		const lettersAlreadyUsed = [
				...(this.diceKeyToSplitIntoShares == null ? [] : [this.diceKeyToSplitIntoShares.centerFace.letter]),
				...this.userProvidedShares.map( ({x}) => number0to24ToFaceLetter(Number(x) % 25 as Number0To24) )
			];
		return getRemainingCenterLetters(lettersAlreadyUsed, this.startDerivedShareCenterFacesAtLetter)
			.slice(0, numSharesToGenerate)
			.map( (letter, i) => ({
					x: BigInt(faceLetterToNumber0to24(letter)),
					y: this.pseudoRandom24YValuesDerivedFromUserSpecifiedDiceKey[i]!,
				} satisfies DiceKeyInFiniteFieldPointFormat)
			);
	}

	/**
	 * The redundant shares (those beyond minSharesToDecode) that do not
	 * define the secret in our calculations but can be used to re-derive it
	 * if other shares are missing.
	 */
	get derivedRedundantShares(): DiceKeyInFiniteFieldPointFormat[] {
		const numRedundantSharesNeeded = this.numSharesToDisplay - (this.minSharesToDecode - (this.userSpecifiedDiceKeyToSplitIntoShares == null ? 0 : 1));
		// These shares define the secret and are sufficient to decode it
		const userDefinedPoints = [
			...(this.userSpecifiedDiceKeyToSplitIntoShares == null ? [] : [this.userSpecifiedDiceKeyToSplitIntoShares.asShamirShareFiniteFieldPoint]),
			...this.userProvidedSharesSorted,
		];
		const definingPoints = [
			...userDefinedPoints,
			...this.pseudoRandomShares
		];
		if (definingPoints.length < this.minSharesToDecode) return [];
		const derivedShareCenterLetters = getRemainingCenterLetters(
			definingPoints.map( ({x}) => number0to24ToFaceLetter(Number(x) % 25 as Number0To24) ),
			this.startDerivedShareCenterFacesAtLetter
		).slice(0, numRedundantSharesNeeded);
		console.log(`derivedRedundantShares`, derivedShareCenterLetters, this.numSharesToDisplay, this.minSharesToDecode);
		return secretSharingForDiceKeys.generateSharesForLetters(
			definingPoints,
			derivedShareCenterLetters,
			this.minSharesToDecode
		);
	}

	get generatedShares() {
		return [
			...this.pseudoRandomShares,
			...this.derivedRedundantShares
		];
	}

	// get derivedDiceKeys(): DiceKeyWithoutKeyId[] {
	// 	return this.derivedRedundantShares.map( DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing )
	// }

	get sharesAsDiceKeys(): {source: "user" | "pseudorandom" | "interpolated", diceKey: DiceKey}[] {
		return [
			...this.userProvidedSharesSorted.map( share => ({source: "user" as const, share}) ),
			...this.pseudoRandomShares.map( share => ({source: "pseudorandom" as const, share}) ),
			...this.derivedRedundantShares.map( share => ({source: "interpolated" as const, share}) )
		].map( ({source, share}) => ({
			source,
			diceKey: DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing(share)
		}) );
	}


  constructor(
    parentNavState: NavigationPathState,
		{
			userSpecifiedDiceKeyToSplitIntoShares,
			minSharesToDecode = 2,
			numSharesToDisplay = 3,
		} : {
			userSpecifiedDiceKeyToSplitIntoShares?: DiceKey,
			minSharesToDecode?: number,
			numSharesToDisplay?: number,
		}
  ) {
    this.navState = new NavigationPathState(parentNavState, SimpleSecretSharingStateName, () => "");
		this.minSharesToDecode = minSharesToDecode;
		this.numSharesToDisplay = numSharesToDisplay;
		this.userSpecifiedDiceKeyToSplitIntoShares = userSpecifiedDiceKeyToSplitIntoShares;
    makeAutoObservable(this);
		this.#generate24RandomYValuesForUserSpecifiedDiceKey();
  }
}

// Should deterministic shares been generated via a pseudo-random number generator seeded by the secret?