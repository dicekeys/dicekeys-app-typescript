
import { action, autorun, makeAutoObservable } from "mobx";
import { DiceKeyInFiniteFieldPointFormat } from "../../dicekeys/DiceKey/asShamirShare";
import { secretSharingForDiceKeys } from "../../dicekeys/DiceKey/SecretSharingForDiceKeys";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { ViewState } from "../../state/core/ViewState";
import { DiceKey, DiceKeyWithoutKeyId, FaceLetter, faceLetterToNumber0to24 } from "../../dicekeys/DiceKey";
import { LoadDiceKeyViewState } from "../LoadingDiceKeys/LoadDiceKeyViewState";
import { HideRevealSecretsState } from "../../state/stores/HideRevealSecretsState";

export const SecretSharingRecoveryStateName = "SecretSharingRecoveryState" as const;
export class SecretSharingRecoveryState implements ViewState {
  readonly viewName = SecretSharingRecoveryStateName;
  navState: NavigationPathState;

	/**
	 * The minimum number of shares needed to recover the DiceKey.
	 */
	minSharesToDecode: number = 3;
	loadDiceKeyViewState: LoadDiceKeyViewState | undefined;
	secretCenterLetter: FaceLetter | undefined;

	get secretCenterLetterAsBigInt() {
		return this.secretCenterLetter != null ? BigInt(faceLetterToNumber0to24(this.secretCenterLetter)) : undefined;
	}


	setMinSharesToDecode = action( (minSharesToDecode: number) => {this.minSharesToDecode=minSharesToDecode} );
	setSecretCenterLetter = action( (secretCenterLetter: FaceLetter | undefined) => {this.secretCenterLetter=secretCenterLetter} );
	
	/**
	 * Shares scanned by the user
	 */
	userScannedSharesUnfiltered: DiceKeyInFiniteFieldPointFormat[] = [];

	get userScannedSharesSorted() {
		return this.userScannedSharesUnfiltered.filter( s => s.x != this.secretCenterLetterAsBigInt ).sort( (a, b) => Number(a.x) - Number(b.x) );
	}
	get userScannedSharesAsDiceKeys() { return this.userScannedSharesSorted.map( s => DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing(s) ) }

	get derivedDiceKeyInFiniteFieldFormat(): DiceKeyInFiniteFieldPointFormat | undefined {
		return (this.userScannedSharesSorted.length < this.minSharesToDecode || this.secretCenterLetter == null) ? undefined :
		secretSharingForDiceKeys.recoverDiceKeyInFiniteFieldPointFormat(
			this.secretCenterLetter,
			this.userScannedSharesSorted,
			this.minSharesToDecode
		);
	}

	get derivedDiceKey() {
		const inFiniteFieldFormat = this.derivedDiceKeyInFiniteFieldFormat;
		if (inFiniteFieldFormat == null) return;
		return DiceKeyWithoutKeyId.fromFiniteFieldPointForShamirSharing(inFiniteFieldFormat);;
	}

	addUserScannedShare = action( (diceKey: DiceKey) => {
		const diceKeyAsFiniteFieldPoint = diceKey.asShamirShareFiniteFieldPoint;
		if (diceKeyAsFiniteFieldPoint == null) return;
		this.userScannedSharesUnfiltered = [
			...this.userScannedSharesUnfiltered.filter( s => s.x !== diceKeyAsFiniteFieldPoint.x ),
			diceKeyAsFiniteFieldPoint
		].sort( (a, b) => Number(a.x) - Number(b.x) );
	});

	removeUserScannedShare = action( (centerLetter: FaceLetter) => {
		const x = BigInt(faceLetterToNumber0to24(centerLetter));
		this.userScannedSharesUnfiltered = this.userScannedSharesUnfiltered.filter( s => s.x !== x );
	});

	onLoadDicekeyCompletedOrCancelled = action( (result : {diceKey: DiceKeyWithoutKeyId} | undefined) => {
		this.loadDiceKeyViewState = undefined;
		if (result) {
			const {diceKey} = result;
			HideRevealSecretsState.hideDiceKey(diceKey);
			this.addUserScannedShare(diceKey);
		}
	});

	loadShareAsDiceKey = action( () => {
		this.loadDiceKeyViewState = new LoadDiceKeyViewState(this.navState);
	});

  constructor(
    parentNavState: NavigationPathState,
		{
			...initialSettings
		} : Partial<SecretSharingRecoveryState>
		) {
			Object.assign(this, initialSettings);
			this.navState = new NavigationPathState(parentNavState, 'recover', () => "");
			autorun( () => {
				HideRevealSecretsState.hideDiceKey(this.derivedDiceKey);
			})
	    makeAutoObservable(this);
  }
}
