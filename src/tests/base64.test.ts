import {
  urlSafeBase64Decode,
  urlSafeBase64Encode,
} from "../api/encodings"

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return new Buffer(str, 'binary').toString('base64');
  };
}

if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return new Buffer(b64Encoded, 'base64').toString('binary');
  };
}

describe("Encodings", () => {
  
  test("URL-friendly base64 encode and decode", () => {
    const array = Uint8Array.from([13, 58, 19, 234, 9, 3]);

    const b64 = urlSafeBase64Encode(array);

    const copyOfArray = urlSafeBase64Decode(b64);

  });


});