export const hexStringToUint8ClampedArray = (hexString: string): Uint8ClampedArray =>
  new Uint8ClampedArray((hexString.match(/.{1,2}/g) ?? []).map( (byte) => parseInt(byte, 16)));

export const uint8ClampedArrayToHexString = (bytes: Uint8ClampedArray) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export const uint8ArrayToHexString = (bytes: Uint8Array) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
