import {
  urlSafeBase64Encode, urlSafeBase64Decode, utf8ByteArrayToString
} from "../api/encodings"
import {
  SeededCryptoModuleWithHelpers,
  SymmetricKey
} from "@dicekeys/seeded-crypto-js";
import {randomBytes} from "crypto"
import {
  Observable
} from "./observable"

const getRandomBytes = (numberOfBytes: number): Uint8Array => {
  if (global.window && window.crypto) {
    const bytes = new Uint8Array(numberOfBytes);
    crypto.getRandomValues(bytes);
    return bytes;
  } else {
    return randomBytes(numberOfBytes);
  }
}

const minutesToMs = 60 * 1000;


// export class ValueChangedComponentEvent<T> extends ComponentEvent<[T | undefined], StorageField<T>> {
//   constructor(field: StorageField<T>) { super(field); }

//   onChangeAndInitialValue = (callback: (value: T | undefined) => any) => {
//     callback(this.parent.value);
//     return this.on(callback);
//   }
// }

export abstract class StorageField<T> extends Observable<T> {
  protected static byName = new Map<string, StorageField<any>>();

  public readonly name: string;
//  public readonly changedEvent: ValueChangedComponentEvent<T>;
  constructor (public readonly nameSuffix: string) {
    super();
    this.name =`${this.constructor.name}::${nameSuffix}`;
//    this.changedEvent = new ValueChangedComponentEvent(this);
    StorageField.byName.set(this.name, this);
  }

  protected abstract encodeToString(value: T): string;
  protected abstract decodeFromString(valueAsString: string): T | undefined;

  protected lastValueWritten: T | undefined;
  protected read(): T | undefined {
    const valueAsString = localStorage.getItem(this.name);
    const value = valueAsString == null ? undefined : this.decodeFromString(valueAsString);
    this.lastValueWritten = value;
    return value;
  }

  // override to create a deep equals operation
  equals(a: T | undefined, b: T | undefined): boolean {
    return a === b;
  }

  sendChangeEventIfValueChangedInOtherWindow = () => {
    const lastValue = this.lastValueWritten;
    const currentValue = this.read();
    if (!this.equals(lastValue, currentValue)) {
      this.changedEvent.send(currentValue);
    }
  }

  protected write(value: T | undefined): void {
    if (typeof value === "undefined") {
      this.remove();
    } else {
      const changed = !this.equals(value, this.lastValueWritten);
      this.lastValueWritten = value;
      localStorage.setItem(this.name, this.encodeToString(value));
      if (changed) {
        this.changedEvent.send(value);
      }
    }
    this.lastValueWritten = value;
  }

  remove() {
    const changed = typeof localStorage.getItem(this.name) !== "undefined";
    localStorage.removeItem(this.name);
    this.lastValueWritten = undefined;
    if (changed) {
      this.changedEvent.send(undefined);
    }
  }

  static onFocus = window.addEventListener("focus", () => {
    // See if any values have changed since the window lost focus
    for (const storageField of StorageField.byName.values()) {
      storageField.sendChangeEventIfValueChangedInOtherWindow();
    }
  })


}

export class LocalStorageStringField extends StorageField<string> {
  // The required encode and decode functions are no-ops that just leave the string in place
  encodeToString = (valueThatIsAlreadyAString: string) => valueThatIsAlreadyAString;
  decodeFromString = (valueThatIsAlreadyAString: string) => valueThatIsAlreadyAString;
}

export class LocalStorageField<T> extends StorageField<T> {
  decodeFromString = (jsonSerializedObjOfTypeT: string) => JSON.parse(jsonSerializedObjOfTypeT) as T;
  encodeToString = (objOfTypeT: T) => JSON.stringify(objOfTypeT);
}

export class LocalStorageStringToObjMap<V> extends LocalStorageField<{[key: string]: V}> {
  setField(key: string, value: V) {
    this.value = {
      ...this.value,
      [key]: value
    }
  }

  removeField(key: string) {
    var obj = this.value;
    if (obj) {
      delete obj[key];
    }
    this.value = obj;
  }

  get entries(): [string, V][] {
    const obj = this.value;
    if (obj == null) return [];
    return Object.entries(obj);
  }

}

export class TabsAndWindowsSharingThisState extends LocalStorageStringToObjMap<number> {
  static myWindowId = urlSafeBase64Encode((getRandomBytes(20)));
  static heartbeatFrequencyinMs = 5000;
  static heartbeat: any;

  sendHeartbeat = () => {
    this.setField(TabsAndWindowsSharingThisState.myWindowId, (new Date()).getTime() + 2 * TabsAndWindowsSharingThisState.heartbeatFrequencyinMs);
  }

  constructor (nameSuffix: string = `tabs-and-windows-sharing-this-state`) {
    super(nameSuffix);
    if (TabsAndWindowsSharingThisState.heartbeat == null) {
      TabsAndWindowsSharingThisState.heartbeat = setInterval(
        this.sendHeartbeat,   
        TabsAndWindowsSharingThisState.heartbeatFrequencyinMs
      );
    }
    window.addEventListener("unload", () => {
      clearInterval(TabsAndWindowsSharingThisState.heartbeat)
      this.removeField(TabsAndWindowsSharingThisState.myWindowId);
    });
    this.sendHeartbeat();
  }

  public get countOfOthers() {
    const nowInMs = (new Date()).getTime();
    const otherWindows = this.entries
      .filter( ([windowId, whenExpires]) => {
        if (windowId === TabsAndWindowsSharingThisState.myWindowId) return false;        
        if (whenExpires < nowInMs) return false;
        // just in case the clock was reset
        if (whenExpires > (nowInMs + 2 * TabsAndWindowsSharingThisState.heartbeatFrequencyinMs))
          return false;

        return true;
      });
      return otherWindows.length;
  }

  public get areThereOthers(): boolean {
    return this.countOfOthers > 0
  }

}

const getSessionEncryptionSymmetricKey = (
  nameSuffix: string,
  seededCryptoModule: SeededCryptoModuleWithHelpers,
  expireAfterMinutesUnused?: number,
) => {
  const keySeedCookieName = `encrypted-state-key-seed::${nameSuffix}`;
  
  const createKeySeed = (): string => {
    return urlSafeBase64Encode((getRandomBytes(20)));
  }

  const setSessionKeySeedCookie = (value: string): string => {
    var expires: string | undefined;
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

  const getSessionKeySeedCookie = (): string => {
    const cookiePrefix = keySeedCookieName + "=";
    const cookieRead = (document.cookie || "")
      .split(';')
      .map(c => c.trim())
      .filter(cookie => {
        return cookie.startsWith(cookiePrefix);
      })
      .map( cookie => cookie.substr(cookiePrefix.length).trim())
      [0];
    if (cookieRead) {
      // Write the cookie back, in orer to reset the expiration clock]
      setSessionKeySeedCookie(cookieRead);
    }
    return cookieRead;
  }

  const getOrCreateSessionKeySeedCookie = (): string => 
    getSessionKeySeedCookie() ||
    setSessionKeySeedCookie(createKeySeed());

  // const extendExpiration = (): void => {
  //   getSessionKeySeedCookie();
  // }

  return seededCryptoModule.SymmetricKey.deriveFromSeed(getOrCreateSessionKeySeedCookie(), "");


}

export class EncryptedStorageField<T> extends StorageField<T> {
  constructor (name: string, protected readonly symmetricKey: SymmetricKey) {
    super(name);
  }

  protected encodeToString = (objOfTypeT: T) =>
    urlSafeBase64Encode(this.symmetricKey.sealToCiphertextOnly(JSON.stringify(objOfTypeT)));


  protected decodeFromString = (base64EncodedEncryptedJsonSerializedObjOfTypeT: string): T | undefined => {
    try {
      const ciphertext = urlSafeBase64Decode(base64EncodedEncryptedJsonSerializedObjOfTypeT);
      const plaintextBuffer = this.symmetricKey.unsealCiphertext(ciphertext, "");
      const plaintextBufferJson = utf8ByteArrayToString(plaintextBuffer);
      return JSON.parse(plaintextBufferJson) as T;
    } catch (e) {
      // Benign case is that key expired, in which case we just pretend data is not there.
      // That's fine for malicious case as well.
      return undefined;
    }
  }
}


export class AppStateStore {
  addStringField = (name: string) => new LocalStorageStringField(name); 
  addField = <T>(name: string) => new LocalStorageField<T>(name); 
}

/**
 * The application state needs to persist across tabs, so we need to use
 * window.localStorage and not window.sessionStorage.
 * 
 * However, the application state should automatically expire if our window is closed or if
 * `expireAfterMinutesUnused` minutes have passed, but window.localStorage
 * does not support expiration.  So, we'll need to use session cookies to get automatic
 * expiration and be sure the data is erased from memory when the browser closes.
 * 
 * The application data should never be sent to the server, but cookies are always sent
 * to the server. So what to do?
 * 
 * We write the state to local storage, and encrypt it with a key stored in
 * a session cookie.  Yes, the cookie containing the random key is sent to the
 * server, but the data it encrypts never is.
 */
export class EncryptedAppStateStore extends AppStateStore {
  protected readonly symmetricKey: SymmetricKey;
  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    expireAfterMinutesUnused?: number
  ) {
    super();
    this.symmetricKey = getSessionEncryptionSymmetricKey(this.constructor.name, seededCryptoModule, expireAfterMinutesUnused);
  }

  protected addEncyrptedField = <T>(name: string) => new EncryptedStorageField<T>(name, this.symmetricKey);


}
