import * as keytar from 'keytar';

const keytarServiceName = "DiceKeys"

export const getDiceKeyFromCredentialStore = (id: string) => keytar.getPassword(keytarServiceName, id);
export const storeDiceKeyInCredentialStore = (id: string, humanReadableForm: string,) => keytar.setPassword(keytarServiceName, id, humanReadableForm);
export const deleteDiceKeyFromCredentialStore = (id: string) => keytar.deletePassword(keytarServiceName, id);
