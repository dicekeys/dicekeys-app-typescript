const validControlCodes = new Set<number>(
  "\t\r\n".split("").map( c => c.charCodeAt(0) )
)

export function isMessageUTF8PrintableString(message: Uint8Array): boolean {
  // https://en.wikipedia.org/wiki/UTF-8, see table in section "Description"
  for (let i=0; i < message.length;) {
    const byte = message[i++];
    if (byte == null) continue;
    if (byte < 32 && !validControlCodes.has(byte)) {
      // The only control characters allowed are tabs, carriage returns, and line feeds. (space is byte 32)
      return false;
    }
    if (byte == 127) {
      // DEL control character
      return false;
    }
    const additionalBytes =
        // byte of the form 0xxxxxxx, ASCII character with no additional bytes
        ( (byte & 0x80) === 0 ) ? 0 :
        // byte of the form 110xxxxx, 1 additional byte
        ( (byte & 0xe0) === 0xc0 ) ? 1 :
        // byte of the form 1110xxxx, 1 additional byte
        ( (byte & 0xf0) === 0xe0 ) ? 2 :
        // byte of the form 11110xxx, 1 additional byte
        ( (byte & 0xf8) === 0xf0 ) ? 3 :
        // illegal first code point
        -1;
    if (additionalBytes < 0) {
      // Illegal UTF8 code point.
      return false;
    }
    if (i + additionalBytes > message.length) {
      // Character would extend beyond byte array
      return false;
    }
    for (let j = 0; j < additionalBytes; j++) {
      // All additional bytes for this character must be of the form 10xxxxxx
      const extensionByte = message[i++]!;
      if ((extensionByte & 0xc0) != 0x80) {
        return false;
      }
    }
  }
  return true;
}