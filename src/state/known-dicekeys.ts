import { LocalStorageField } from "../web-component-framework/locally-stored-state";


export const diceKeyIdToCenterFace = new LocalStorageField<{[keyId: string]: string}>("DiceKeyIdToCenterFace");

export const appHasScannedADiceKeyBefore = () => Object.keys(diceKeyIdToCenterFace.value ?? {}).length > 0;

