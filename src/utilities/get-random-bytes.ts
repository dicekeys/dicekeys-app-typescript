// import {randomBytes} from "crypto";

export const getRandomBytes: (numberOfBytes: number) => Uint8Array =
  (window && window.crypto) ? 
  (
    (numberOfBytes: number) => {
      const bytes = new Uint8Array(numberOfBytes);
      window.crypto.getRandomValues(bytes);
      return bytes;
    }
  ) :
  (() => {
    // Test purposes only in NodeJS.  Uses Math.random and not crypto
    return  (numberOfBytes: number): Uint8Array =>
    Uint8Array.from( Array.from(new Array(numberOfBytes), (_)=> Math.floor(Math.random() * 256) %  256) );
  })();

export const getRandomUInt32 = () =>
  getRandomBytes(4).reduce( (r, ubyte) => {
    return (r * 256) + ubyte
  }, 0);
