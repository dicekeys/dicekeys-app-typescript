import * as IpcApiFactory from "./IpcApiFactory"
import * as keytar from 'keytar';
import * as crypto from 'crypto';
import * as fs from 'fs';
import {promises as fsp} from "fs"
import * as path from 'path';
import {app} from 'electron';

const keytarServiceName = "DiceKeys"
const keytarAccountName = "DiceKeysEncryptionKey"
const storeFileName = "encrypted_dicekeys.json"

type StoredDiceKeys = {
    [id: string]: string;
};

interface EncryptionKey{
    key: string,
    iv: string
}

IpcApiFactory.implementAsyncApi( "setDiceKey", async (id: string, humanReadableForm: string) => {
    const encryptionKey = await getEncryptionKey()
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey.key, encryptionKey.iv)
    const encryptedHumanReadableForm = cipher.update(humanReadableForm, "utf8", "base64")
    let storedDiceKeys = await loadStoredDiceKeys()
    storedDiceKeys[id] = encryptedHumanReadableForm
    await saveStoredDiceKeys(storedDiceKeys)
});


IpcApiFactory.implementAsyncApi( "getDiceKey", getDiceKey);
async function getDiceKey(id: string): Promise<string> {
    const encryptionKey = await getEncryptionKey()
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey.key, encryptionKey.iv)

    let storedDiceKeys = await loadStoredDiceKeys()
    const encryptedHumanReadableForm = storedDiceKeys[id]

    return new Promise<string>((resolve, reject) => {

        if (encryptedHumanReadableForm !== null) {
            resolve(decipher.update(encryptedHumanReadableForm, "base64", "utf8"))
        } else {
            reject("doesn't exists")
        }
    })

}

IpcApiFactory.implementAsyncApi( "getDiceKeys", async () => {
    let storedDiceKeys = await loadStoredDiceKeys()

    let unencrypted : {[id: string]: { id: string, humanReadableForm: string}} = {}
    for (let id in storedDiceKeys) {
        unencrypted[id] = {id: id, humanReadableForm: await getDiceKey(id)}
    }

    return unencrypted
});

IpcApiFactory.implementAsyncApi( "deleteDiceKey", async (id: string): Promise<boolean> => {
    let storedDiceKeys = await loadStoredDiceKeys()
    if(storedDiceKeys[id]){
        delete storedDiceKeys[id]
        await saveStoredDiceKeys(storedDiceKeys)
        return true
    }else{
        return false
    }
});

async function loadStoredDiceKeys(): Promise<StoredDiceKeys>{
    const filename =  path.join(app.getPath('userData'), storeFileName)

    if(fs.existsSync(filename)){
        const json = await fsp.readFile(filename, "utf8")
        try{
            return JSON.parse(json) as StoredDiceKeys
        }catch (e) {
            console.log(e)
        }
    }
    return {}
}

async function saveStoredDiceKeys(store: StoredDiceKeys): Promise<void>{
    const filename =  path.join(app.getPath('userData'), storeFileName)
    return fsp.writeFile(filename, JSON.stringify(store))
}

function randomString(size = 32) {
    return crypto
        .randomBytes(size)
        .toString('base64')
        .slice(0, size)
}

async function getEncryptionKey(): Promise<EncryptionKey>  {
    const jsonPassword = await keytar.getPassword(keytarServiceName, keytarAccountName)
    if(jsonPassword !== null){
        return JSON.parse(jsonPassword) as EncryptionKey
    }else{
        const encryptionKey = {
            key : randomString(32),
            iv: randomString(16)
        }
        await keytar.setPassword(keytarServiceName, keytarAccountName, JSON.stringify(encryptionKey))
        return encryptionKey
    }
}
