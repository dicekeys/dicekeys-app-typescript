
export const base64Encode = (unencoded: Uint8Array) =>
  new Buffer(unencoded || '').toString('base64')

export const base64Decode = (encoded: string) =>
  new Buffer(encoded || '', 'base64').toString('utf8')

export const urlSafeBase64Encode = (unencoded: Uint8Array) =>
  base64Encode(unencoded)
  .replace('+', '-').replace('/', '_').replace(/=+$/, '');

export const urlSafeBase64Decode  = (encoded: string) => {
  encoded = encoded.replace('-', '+').replace('_', '/');
  while (encoded.length % 4)
    encoded += '=';
  return base64Decode(encoded);
};
