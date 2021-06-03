import * as HID from "node-hid";
import * as crypto from "crypto"


// Error reported when the user fails to grant access
const CTAP_RESULT = {
  ERR_OPERATION_DENIED: 0x27,
  ERR_INVALID_LENGTH: 0x03,
  ERR_UNSUPPORTED_OPTION: 0x2B,
  ERR_INVALID_COMMAND: 0x01,
} as const;

class SeedingException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ExceptionUserDidNotAuthorizeSeeding extends SeedingException {}
export class ExceptionKeyReportedInvalidLength extends SeedingException {}
export class ExceptionKeyDoesNotSupportSeedingVersion extends SeedingException {}
export class ExceptionKeyDoesNotSupportCommand extends SeedingException {}
export class ExceptionUnknownSeedingException extends SeedingException {}

const getExceptionForCtapResult = (ctapResult?: number): SeedingException => {
  switch (ctapResult) {
    case CTAP_RESULT.ERR_OPERATION_DENIED: return new ExceptionUserDidNotAuthorizeSeeding();
    case CTAP_RESULT.ERR_INVALID_COMMAND: return new ExceptionKeyDoesNotSupportCommand();
    case CTAP_RESULT.ERR_UNSUPPORTED_OPTION: return new ExceptionKeyDoesNotSupportSeedingVersion();
    case CTAP_RESULT.ERR_INVALID_LENGTH: return new ExceptionKeyReportedInvalidLength();
    default: return new ExceptionUnknownSeedingException();
  }
}

const BroadcastChannel = 0xffffffff;

const CTAP_HID_Commands = {
  MSG: 0x03,
  INIT: 0x06,
  WINK: 0x08,
  ERROR: 0x3F,
  WRITE_SEED: 0x62,
} as const;

// In DataView, set BigEndian by sending false to the littleEndian field.
const makeBigEndianPassingFalseForLittleEndian = false;

const hidPacketLengthInBytes = 64

/// This class decodes CTAP HID packets received from a security key
class CtapHidPacketReceived {

  /// Construct this class to decode the values in a CTAP HID Packet
  /// - Parameter packet: the raw HID packet received
  constructor(private readonly packet: DataView) {
  }

  get headerSizeInBytes(): number {
    return this.isInitializationPacket ? 7 : 5
  }
  get channel(): number {
    return this.packet.getUint32(0, makeBigEndianPassingFalseForLittleEndian)
  }

  get commandByte(): number {
    return this.packet.getUint8(4);
  }
  get isInitializationPacket(): boolean {
    return (this.commandByte & 0x80) != 0
  }
  
  get command(): number {
    return this.commandByte & 0x7f
  }

  get length(): number {
    return this.isInitializationPacket ?
        this.packet.getUint16(5, makeBigEndianPassingFalseForLittleEndian) :
        (hidPacketLengthInBytes - this.headerSizeInBytes)
  }
  get message(): DataView {
    return new DataView(this.packet.buffer.slice(this.headerSizeInBytes))
  }
}

type HIDDevice = HID.HID

/// A class used to decode the contents of an HID INIT response
class CtapHidInitResponseMessage {
  /// Decode an HID INIT response message from the data within the response
  /// - Parameter message: The data encoded in the packet
  constructor(private readonly message: DataView) {}
  
  // DATA    8-byte nonce
  get nonce(): Uint8ClampedArray {
    return new Uint8ClampedArray(this.message.buffer.slice(0, 8));
  }

  // DATA+8    4-byte channel ID
  get channelCreated(): number {
    return this.message.getUint32(8, makeBigEndianPassingFalseForLittleEndian);
  }

  // DATA+12    CTAPHID protocol version identifier
  get ctapProtocolVersionIdentifier(): number{ return this.message.getInt8(12) }
  // DATA+13    Major device version number
  get majorDeviceVersionNumber(): number{ return this.message.getInt8(13) }
  // DATA+14    Minor device version number
  get minorDeviceVersionNumber(): number{ return this.message.getInt8(14) }
  // DATA+15    Build device version number
  get buildDeviceVersionNumber(): number{ return this.message.getInt8(15) }
  // DATA+16    Capabilities flags
  get capabilitiesFlags(): number{ return this.message.getInt8(16) }
}

const sendReport = (device: HIDDevice, data: DataView, reportType: number = 0): number => {
  let dataArray = new Uint8ClampedArray(data.buffer);
  let dataParameter = [0x00, ...dataArray];
  let buffer = Buffer.from(dataParameter);
  return device.write(buffer);
}

const sendCtapHidMessage = (device: HIDDevice, channel: number, command: number, data: DataView) => {
  /*
   *            INITIALIZATION PACKET
   *            Offset   Length    Mnemonic    Description
   *            0        4         CID         Channel identifier
   *            4        1         CMD         Command identifier (bit 7 always set)
   *            5        1         BCNTH       High part of payload length
   *            6        1         BCNTL       Low part of payload length
   *            7        (s - 7)   DATA        Payload data (s is equal to the fixed packet size)
   */
  // Create a zero-filled packet
  const initializationPacketArray = new Uint8ClampedArray(hidPacketLengthInBytes)
  const initializationPacket = new DataView(initializationPacketArray.buffer);
  initializationPacket.setUint32(0, channel, makeBigEndianPassingFalseForLittleEndian);
  initializationPacket.setUint8(4, command | 0x80);
  initializationPacket.setUint16(5, data.byteLength, makeBigEndianPassingFalseForLittleEndian);
  let dest = 7, src = 0, packetSequenceByte = 0;
  // Copy the data
  while (dest < hidPacketLengthInBytes && src < data.byteLength) {
    initializationPacket.setUint8(dest++, data.getUint8(src++));
  }
  sendReport(device, initializationPacket);

  while(src < data.byteLength && packetSequenceByte < 0x80) {
      /**
       *  CONTINUATION PACKET
       *  Offset    Length    Mnemonic  Description
       *  0         4         CID       Channel identifier
       *  4         1         SEQ       Packet sequence 0x00..0x7f (bit 7 always cleared)
       *  5         (s - 5)   DATA      Payload data (s is equal to the fixed packet size)
       */
      dest = 5;
      const continuationPacketArray = new Uint8ClampedArray(hidPacketLengthInBytes)
      const continuationPacket = new DataView(continuationPacketArray);
      continuationPacket.setUint32(0, channel, makeBigEndianPassingFalseForLittleEndian);
      continuationPacket.setUint8(4, packetSequenceByte);
      // Copy the data
      while (dest < hidPacketLengthInBytes && src < data.byteLength) {
        continuationPacket.setUint8(dest++, data.getUint8(src++));
      }
      sendReport(device, continuationPacket);
    }
}

const getChannel = (device: HIDDevice): number => {
  let channelCreationNonce = Uint8ClampedArray.from(crypto.randomBytes(8));

  sendCtapHidMessage(device, BroadcastChannel, CTAP_HID_Commands.INIT, new DataView(channelCreationNonce.buffer));
  while (true) {
    const response = device.readSync();
    //console.log(`response: ${response}`);
    let buffer = Uint8ClampedArray.from(response).buffer;
    const packet = new CtapHidPacketReceived(new DataView(buffer));    
    const message = new CtapHidInitResponseMessage(packet.message);
    if (message.nonce.every( (byte, index) => byte == channelCreationNonce[index] )) {
      // The nonces match so this is the channel we requested
      //console.log(`Created channel ${message.channelCreated}`)
      return message.channelCreated;
    } else {
      // console.log(`Nonces did not match:${"\n"}Request:${channelCreationNonce}${"\n"}Response:${message.nonce}`)
      // This wasn't the response we were waiting for.  Wait for another one.
    }
  }
}


const sendWriteSeedMessage = (device: HIDDevice, channel: number, seed: Uint8ClampedArray, extState: Uint8ClampedArray): void => { 
  const commandVersion = 1;
  if (seed.length != 32) {
    throw new ExceptionKeyReportedInvalidLength("Seed must be 32 bytes")
  }
  if (extState.length > 256) {
    throw new ExceptionKeyReportedInvalidLength("ExtState must be 32 bytes")
  }

  // SoloKeys code triggered by this call is at:
  // https://github.com/conorpp/solo/blob/eae4af7dcd2aef689b16a43adf0e1719adcc9f16/fido2/ctaphid.c#L786
  // bytes:       1        32     0..256
  // payload:  version  seedKey  extState
  const message = new Uint8ClampedArray([commandVersion, ...seed, ...extState]);
  sendCtapHidMessage(device, channel, CTAP_HID_Commands.WRITE_SEED, new DataView(message.buffer));
  while (true) {
    const response = device.readSync()
    const packet = new CtapHidPacketReceived(new DataView(Uint8ClampedArray.from(response).buffer));
    if (packet.channel != channel) {
      // This message wasn't meant for us.
      continue;
    }
    if (packet.command == CTAP_HID_Commands.WRITE_SEED) {
      // Return success
      return
    } else if (packet.command == CTAP_HID_Commands.ERROR) {
      // The message contains a 1-byte error code to report what went wrong
      throw getExceptionForCtapResult(packet.message.getInt8(0));
    } else {
      throw new ExceptionUnknownSeedingException(`HID Command ${packet.command} returned error byte ${packet.message.getUint8(0)}`);
    }
  }
}

/**
 * Write a cryptographic seed to a seedable FIDO key 
 * https://github.com/dicekeys/seeding-webauthn
 * 
 * @param device The USB FIDO key to write to
 * @param seed The 32-byte cryptographic seed
 * @param extState Up to 256-bytes of additional state to store
 * 
 * @throws ExceptionUserDidNotAuthorizeSeeding if the user does not authorize the write by tapping on the button.
 * @throws SeedingException other exceptions (typically implementation issues)
 */
export const writeSeedToFIDOKey = (deviceDescription: HID.Device, seed: Uint8ClampedArray, extState: Uint8ClampedArray = new Uint8ClampedArray(0)) => {
  const {path} = deviceDescription;
  // console.log(`Device path: ${path}`);
  if (!path) {
    return;
  }
  const device = new HID.HID(path);
  try {
    const channel = getChannel(device);
    return sendWriteSeedMessage(device, channel, seed, extState);
  } finally {
    device.close()
  }
}

// const testSeed = new Uint8ClampedArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 30, 31]);
// export const test = () => {
//   //   (vendorId == 0x0483 && productId == 0xa2ca);
//   const devices = HID.devices(0x0483, 0xa2ca);
//   if (devices.length == 0) {
//     console.log("No devices")
//     return;
//   }
//   const [deviceInfo] = devices;
//   console.log(`Device: ${JSON.stringify(deviceInfo, undefined, 2)}`)
//   writeSeedToFIDOKey(deviceInfo, testSeed);
// }

// test();
