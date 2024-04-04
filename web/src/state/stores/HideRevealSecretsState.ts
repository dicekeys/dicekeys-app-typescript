import { action, makeAutoObservable } from "mobx";
import { DiceKey, FaceLetterAndDigit } from "../../dicekeys/DiceKey";
import { autoSave } from "../core";

export interface BooleanWithToggle {
	getValue: () => boolean;
	toggle: () => void;
}

const toFaceLetterAndDigit = (diceKeyOrCenterFaceLetterAndDigit: DiceKey | FaceLetterAndDigit | undefined): FaceLetterAndDigit | "" =>
	(diceKeyOrCenterFaceLetterAndDigit == null) ? "" :
	(typeof diceKeyOrCenterFaceLetterAndDigit	=== "string") ? diceKeyOrCenterFaceLetterAndDigit : 
		diceKeyOrCenterFaceLetterAndDigit.centerLetterAndDigit;

export const HideRevealSecretsState = new (class HideRevealSecretsState {
	centerLetterAndDigitToShouldKeyBeHidden: Record<string, boolean> = {};
	centerLetterAndDigitToShouldSecretsDerivedFromDiceKeyBeHidden: Record<string, boolean> = {};

	shouldDiceKeyBeHidden = (key: DiceKey | FaceLetterAndDigit | undefined /*, defaultValue: boolean = defaultShouldKeyBeHidden*/) =>
		this.centerLetterAndDigitToShouldKeyBeHidden[toFaceLetterAndDigit(key)]
	
	shouldSecretsDerivedFromDiceKeyBeHidden = (key: DiceKey | FaceLetterAndDigit | undefined /*, defaultValue: boolean = defaultShouldSecretsDerivedFromKeyBeHidden*/) =>
		this.centerLetterAndDigitToShouldSecretsDerivedFromDiceKeyBeHidden[toFaceLetterAndDigit(key)];

	setShouldDiceKeyBeHidden = action( (key: DiceKey | FaceLetterAndDigit | undefined, shouldKeyBeHidden: boolean) => {
		this.centerLetterAndDigitToShouldKeyBeHidden[toFaceLetterAndDigit(key)] = shouldKeyBeHidden;
	});
	setShouldSecretsDerivedFromDiceKeyBeHidden = action ( (key: DiceKey | FaceLetterAndDigit | undefined, shouldSecretsDerivedFromDiceKeyBeHidden: boolean) => {
		this.centerLetterAndDigitToShouldSecretsDerivedFromDiceKeyBeHidden[toFaceLetterAndDigit(key)] = shouldSecretsDerivedFromDiceKeyBeHidden;
	});
	hideDiceKey = (key: DiceKey | FaceLetterAndDigit | undefined) => {
		this.setShouldDiceKeyBeHidden(key, true);
		if (this.shouldSecretsDerivedFromDiceKeyBeHidden(key) === false) {
			this.setShouldSecretsDerivedFromDiceKeyBeHidden(key, true);
		}
	}
	revealDiceKey = (key: DiceKey | FaceLetterAndDigit | undefined) => this.setShouldDiceKeyBeHidden(key, false);
	toggleHideRevealDiceKey = (key: DiceKey | FaceLetterAndDigit | undefined, defaultIfNotSet: boolean) => (this.shouldDiceKeyBeHidden(key) ?? defaultIfNotSet) ? this.revealDiceKey(key) : this.hideDiceKey(key);
	toggleHideRevealDiceKeyFn = (key: DiceKey | FaceLetterAndDigit | undefined, defaultIfNotSet: boolean) => () => this.toggleHideRevealDiceKey(key, defaultIfNotSet);
	hideRevealDiceKeyBooleanWithToggle = (key: DiceKey | FaceLetterAndDigit | undefined, defaultIfNotSet: boolean): BooleanWithToggle => ({
		getValue: () => this.shouldDiceKeyBeHidden(key) ?? defaultIfNotSet,
		toggle: this.toggleHideRevealDiceKeyFn(key, defaultIfNotSet)
	});

	hideSecretsDerivedFromDiceKey = (key: DiceKey | FaceLetterAndDigit | undefined) => this.setShouldSecretsDerivedFromDiceKeyBeHidden(key, true);
	revealSecretsDerivedFromDiceKey = (key: DiceKey | FaceLetterAndDigit | undefined) => this.setShouldSecretsDerivedFromDiceKeyBeHidden(key, false);
	toggleHideRevealSecretsDerivedFromDiceKey = (key: DiceKey | FaceLetterAndDigit | undefined, defaultIfNotSet: boolean) =>
		this.setShouldSecretsDerivedFromDiceKeyBeHidden(key, !(this.shouldSecretsDerivedFromDiceKeyBeHidden(key) ?? defaultIfNotSet));
	toggleHideRevealSecretsDerivedFromDiceKeyFn = (key: DiceKey | FaceLetterAndDigit | undefined, defaultIfNotSet: boolean) => () =>
			this.toggleHideRevealSecretsDerivedFromDiceKey(key, defaultIfNotSet);
	hideRevealSecretsDerivedFromDiceKeyBooleanWithToggle = (key: DiceKey | FaceLetterAndDigit | undefined, defaultIfNotSet: boolean): BooleanWithToggle => ({
		getValue: () => this.shouldSecretsDerivedFromDiceKeyBeHidden(key) ?? defaultIfNotSet,
		toggle: this.toggleHideRevealSecretsDerivedFromDiceKeyFn(key, defaultIfNotSet)
	});


	constructor() {
		makeAutoObservable(this);
		autoSave(this, "DiceKeysObscureStates")
	}
})();

