import { urlSafeBase64Encode } from "@dicekeys/dicekeys-api-js";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { getRandomBytes } from "../../utilities/get-random-bytes";

const minutesToMs = 60 * 1000;

const getSessionEncryptionSymmetricKey = async (
  nameSuffix: string,
  expireAfterMinutesUnused: number = 60,
) => {
  const keySeedCookieName = `encrypted-state-key-seed::${nameSuffix}`;
  
  const createKeySeed = (): string => {
    return urlSafeBase64Encode(getRandomBytes(20));
  }

  const setSessionKeySeedCookie = (value: string): string => {
    let expires: string | undefined;
    if (expireAfterMinutesUnused != null) {
      const expireAfterMsUnused = expireAfterMinutesUnused * minutesToMs;
      const expireDate = new Date((new Date()).getTime() + expireAfterMsUnused);
      const expireDateUtc = expireDate.toUTCString();
      expires = `expires=${expireDateUtc}; `;
    }

    document.cookie =
      `${keySeedCookieName}=${value}; SameSite=Strict; ${expires}path=/`;
    return value;
  }

  const getSessionKeySeedCookie = (): string | undefined => {
    const cookiePrefix = keySeedCookieName + "=";
    const cookieRead = (document.cookie ?? "")
      .split(';')
      .map(c => c.trim())
      .filter(cookie => {
        return cookie.startsWith(cookiePrefix);
      })
      .map( cookie => cookie.substring(cookiePrefix.length).trim())
      [0];
    if (cookieRead) {
      // Write the cookie back, in order to reset the expiration clock]
      setSessionKeySeedCookie(cookieRead);
    }
    return cookieRead;
  }

  const getOrCreateSessionKeySeedCookie = (): string => 
    getSessionKeySeedCookie() ||
    setSessionKeySeedCookie(createKeySeed());

  return (await SeededCryptoModulePromise).SymmetricKey.deriveFromSeed(getOrCreateSessionKeySeedCookie(), "");
}

const storageKeyPromise = getSessionEncryptionSymmetricKey("DiceKeys-App-State");

export const encryptJsonStorageField = async (json: string) => (await storageKeyPromise).seal(json).toJson();

export const decryptJsonStorageField = async (packagedSealedMessageJson: string) =>
  new TextDecoder().decode(
    (await storageKeyPromise).unsealJsonPackagedSealedMessage( packagedSealedMessageJson)
  );

export const readStringFromEncryptedLocalStorageField = async (fieldName: string) => {
  const encryptedValue = localStorage.getItem(fieldName);
  if (encryptedValue != null)
    return await decryptJsonStorageField(encryptedValue);
  else
    return undefined;
}

export const writeStringToEncryptedLocalStorageField = async (fieldName: string, json: string) => {
  localStorage.setItem(fieldName, await encryptJsonStorageField(json));
}