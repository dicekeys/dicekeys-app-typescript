import {randomBytes} from "crypto";

export const getRandomBytes = (numberOfBytes: number): Uint8Array => {
  if (global.window && window.crypto) {
    const bytes = new Uint8Array(numberOfBytes);
    crypto.getRandomValues(bytes);
    return bytes;
  } else {
    return Uint8Array.from(randomBytes(numberOfBytes));
  }
}
export const getRandomUInt32 = () =>
  getRandomBytes(4).reduce( (r, ubyte) => {
    return (r * 256) + ubyte
  }, 0);
