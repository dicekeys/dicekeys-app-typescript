import * as IpcApiFactory from "./IpcApiFactory"
import * as keytar from 'keytar';

const keytarServiceName = "DiceKeys"
IpcApiFactory.implementAsyncApi( "getDiceKeyFromCredentialStore", (id: string) => keytar.getPassword(keytarServiceName, id));
IpcApiFactory.implementAsyncApi( "storeDiceKeyInCredentialStore", (id: string, humanReadableForm: string,) => keytar.setPassword(keytarServiceName, id, humanReadableForm));
IpcApiFactory.implementAsyncApi( "deleteDiceKeyFromCredentialStore", (id: string) => keytar.deletePassword(keytarServiceName, id));
