import { LocalStorageField } from "../web-component-framework/locally-stored-state";


export const diceKeyIdToNicknameMap = new LocalStorageField<{[keyId: string]: string}>("DiceKeyIdToNickname");

export const appHasScannedADiceKeyBefore = () => Object.keys(diceKeyIdToNicknameMap.value ?? {}).length > 0;

