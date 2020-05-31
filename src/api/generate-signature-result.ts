import {
    SignatureVerificationKey
} from "@dicekeys/seeded-crypto-js";

export interface GenerateSignatureResult {
    signature: Uint8Array
    signatureVerificationKey: SignatureVerificationKey
}