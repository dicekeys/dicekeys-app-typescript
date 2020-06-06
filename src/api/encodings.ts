/**
 * @jest-environment jsdom
 */
import {TextDecoder, TextEncoder} from "util";

export const utf8ByteArrayToString: (byteArray: Uint8Array) => string =
  (Buffer && Buffer.from) ?
    ((byteArray: Uint8Array) => Buffer.from(byteArray).toString('utf-8')) :
    ((byteArray: Uint8Array) => new TextDecoder().decode(byteArray));

  export const stringToUtf8ByteArray: (str: string) => Uint8Array =
    (Buffer && Buffer.from) ?
      ( (str: string) => new Uint8Array(Buffer.from(str, "utf-8")) ) :
      ( (str: string) => new TextEncoder().encode(str) )
      ;

const base64Encode: (byteArray: Uint8Array) => string =
  (Buffer && Buffer.from) ?
    ((byteArray: Uint8Array) => Buffer.from(byteArray).toString('base64')) :
    ((byteArray: Uint8Array) => btoa(new TextDecoder("utf-8").decode(byteArray)))
  ;

const base64Decode: (base64String: string) => Uint8Array =
  (Buffer && Buffer.from) ?
    (base64String: string) => new Uint8Array(Buffer.from(base64String, "base64")) :
    (base64String: string) => Uint8Array.from(atob(base64String), c => c.charCodeAt(0))
  ;
  
export const urlSafeBase64Encode = (unencoded: Uint8Array) =>
  base64Encode(unencoded)
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");
  //  .replace('+', '-').replace('/', '_').replace(/=+$/, '');

export const urlSafeBase64Decode  = (encoded: string) => {
  encoded = encoded
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  while (encoded.length % 4)
    encoded += '=';
  return base64Decode(encoded);
};
