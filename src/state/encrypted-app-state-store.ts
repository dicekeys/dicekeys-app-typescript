import {
  urlSafeBase64Encode, urlSafeBase64Decode, utf8ByteArrayToString
} from "../api/encodings"
import {
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {randomBytes} from "crypto"

const minutesToMs = 60 * 1000;

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
export class EncryptedAppStateStore {
  constructor(
    private readonly seededCryptoModule: SeededCryptoModuleWithHelpers,
    public expireAfterMinutesUnused: number
  ) {}

  /**
   * Get a cookie name that is unique to this class name
   */
  protected get keySeedCookieName(): string {
    return `encrypted-state-key-seed:${this.constructor.name}:`;
  }
  protected get localStatePrefix(): string {
    return `encrypted-state:${this.constructor.name}:`;
  }

  private createKeySeed = (): string => {
    if (global.window && window.crypto) {
      const newKeySeedBytes = new Uint8Array(20);
      crypto.getRandomValues(newKeySeedBytes);
      return urlSafeBase64Encode(newKeySeedBytes);
    } else {
      return urlSafeBase64Encode((randomBytes(20)));
    }
  }

  private getSessionKeySeedCookie = (
    expireAfterMinutesUnused: number = this.expireAfterMinutesUnused
  ): string => {
    const cookiePrefix = this.keySeedCookieName + "=";
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
      this.setSessionKeySeedCookie(cookieRead, expireAfterMinutesUnused);
    }
    return cookieRead;
  }

  private setSessionKeySeedCookie = (
    value: string,
    expireAfterMinutesUnused: number = this.expireAfterMinutesUnused
  ): string => {
    const expireAfterMsUnused = expireAfterMinutesUnused * minutesToMs;
    const expireDate = new Date((new Date()).getTime() + expireAfterMsUnused);
    const expireDateUtc = expireDate.toUTCString(); 
    document.cookie =
      `${this.keySeedCookieName}=${value}; expires=${expireDateUtc}; path=/`;
    return value;
  }

  private getOrCreateSessionKeySeedCookie = (
    expireAfterMinutesUnused: number = this.expireAfterMinutesUnused
  ): string => 
    this.getSessionKeySeedCookie(expireAfterMinutesUnused) ||
    this.setSessionKeySeedCookie(this.createKeySeed(), expireAfterMinutesUnused);
  
  public extendExpiration = (
    expireAfterMinutesUnused: number = this.expireAfterMinutesUnused
  ): void => {
    this.getSessionKeySeedCookie(expireAfterMinutesUnused);
  }

  protected removeField = (
    name: string
  ): void => {
    localStorage.removeItem(name);
  }

  protected setPlaintextStringField = (
    name: string,
    value: string | undefined
  ): void => {
    if (value == null) {
      return this.removeField(name);
    }
    localStorage.setItem(name, value);
  }

  protected getPlaintextStringField = (
    name: string
  ): string | undefined => {
    return localStorage.getItem(name) ?? undefined
  }

  protected setPlaintextField = <T>(
    name: string,
    value: T | undefined
  ): void =>
    this.setPlaintextStringField(name, value == null ? undefined : JSON.stringify(value));

  protected getPlaintextField = <T>(
    name: string
  ): T | undefined => {
    const value = localStorage.getItem(name);
    return (typeof value === "string") ? JSON.parse(value) as T : undefined;
  }

  protected setEncryptedField = <T>(
    name: string,
    value: T | undefined
  ): void => {
    if (value == null) {
      return this.removeField(name);
    }
    const symmetricKey = this.seededCryptoModule.SymmetricKey.deriveFromSeed(this.getOrCreateSessionKeySeedCookie(), "");
    try {
      this.setPlaintextStringField(name, urlSafeBase64Encode(symmetricKey.sealToCiphertextOnly(JSON.stringify(value))));
    } finally {
      symmetricKey.delete();
    }
  }


  protected getEncryptedField = <T>(
    name: string
  ): T | undefined => {
    const base64EncryptedValue = this.getPlaintextStringField(name);
    if (!base64EncryptedValue) return undefined;
    const keySeed = this.getSessionKeySeedCookie();
    if (!keySeed) return;
    const ciphertext = urlSafeBase64Decode(base64EncryptedValue);
    const symmetricKey = this.seededCryptoModule.SymmetricKey.deriveFromSeed(this.getOrCreateSessionKeySeedCookie(), "");
    try {
      const plaintextBuffer = symmetricKey.unsealCiphertext(ciphertext, "");
      const plaintextBufferJson = utf8ByteArrayToString(plaintextBuffer);
      const result = JSON.parse(plaintextBufferJson) as T;
      return result;
    } finally {
      symmetricKey.delete();
    }
  }
}
