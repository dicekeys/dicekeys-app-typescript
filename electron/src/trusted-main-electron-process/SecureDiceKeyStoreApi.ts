import * as IpcApiFactory from "./IpcApiFactory"
import * as keytar from 'keytar';

const keytarServiceName = "DiceKeys"
IpcApiFactory.implementAsyncApi( "getDiceKey", (id: string) => keytar.getPassword(keytarServiceName, id));
IpcApiFactory.implementAsyncApi( "setDiceKey", (id: string, humanReadableForm: string,) => keytar.setPassword(keytarServiceName, id, humanReadableForm));
IpcApiFactory.implementAsyncApi( "deleteDiceKey", (id: string) => keytar.deletePassword(keytarServiceName, id));
IpcApiFactory.implementAsyncApi( "getDiceKeys", async () => (await keytar.findCredentials(keytarServiceName))
    .map(function (value: { account: string, password: string }) {
        return {id: value.account, humanReadableForm: value.password}
    })
);
