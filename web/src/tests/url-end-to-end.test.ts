/**
 * @jest-environment jsdom
 */
import {
  Recipe,
  UrlApi,
  UnsealingInstructions, UnsealingKeyRecipe
} from "@dicekeys/dicekeys-api-js";
import { strToUTF8Arr } from "../utilities/utf8";
import {
  QueuedUrlApiRequest
} from "../api-handler/QueuedUrlApiRequest";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { jsonStringifyWithSortedFieldOrder } from "../utilities/json";

import { Crypto } from "@peculiar/webcrypto"
global.crypto = new Crypto() as typeof global.crypto;

const defaultSeedString = "a bogus seed";
  
const defaultRespondToHost = "client.app";
const defaultRespondToUrl = `https://${defaultRespondToHost}/--derived-secret-api--/handle-response`;
const defaultServerUrl = "https://dicekeys.app/"

class MockQueuedUrlApiRequest extends QueuedUrlApiRequest {

  transmitResponseUrl: (responseUrl: URL) => void;

  constructor(requestUrl: URL, mockTransmitResponseUrl: (responseUrl: URL) => void) {
    super(requestUrl);
    this.transmitResponseUrl = mockTransmitResponseUrl;
  }
}

const getMockClient = (seedString: string = defaultSeedString) => {
  var client: UrlApi;
  client = new UrlApi(defaultServerUrl, defaultRespondToUrl, url => {
    const requestObj = new MockQueuedUrlApiRequest(url, client.handleResult);
    requestObj.respond(seedString, {});
  });
  return client;
}

describe("End To End Url Api Tests", () => {

  const recipe = jsonStringifyWithSortedFieldOrder(UnsealingKeyRecipe({
    allow: [{host: defaultRespondToHost}]
  }));
  const testMessage = "The secret ingredient is dihydrogen monoxide";
  const testMessageByteArray = strToUTF8Arr(testMessage);

  test("symmetricKeySealAndUnseal", async () => {
    const client = getMockClient();
    const {packagedSealedMessageJson} = await client.sealWithSymmetricKey({
      recipe,
      plaintext: testMessageByteArray
    });
    const { plaintext } = await client.unsealWithSymmetricKey({packagedSealedMessageJson});
    expect(plaintext).toEqual(testMessageByteArray);
  });

  test("fun signAndVerify", async () => {
    const client = getMockClient();
    const sig = await client.generateSignature({
      recipe,
      message: testMessageByteArray
    })
    const {signatureVerificationKeyJson} = await client.getSignatureVerificationKey({recipe})
    const seededCrypto = await SeededCryptoModulePromise;
    const signatureVerificationKey = seededCrypto.SignatureVerificationKey.fromJson(signatureVerificationKeyJson);
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual( (await SeededCryptoModulePromise).SignatureVerificationKey.fromJson(sig.signatureVerificationKeyJson).signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, sig.signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), sig.signature)).toBeFalsy();
  });

  test("fun asymmetricSealAndUnseal", async () => {
    const client = getMockClient();
    const {sealingKeyJson} = await client.getSealingKey({recipe});
    const seededCrypto = await SeededCryptoModulePromise;
    const sealingKey = seededCrypto.SealingKey.fromJson(sealingKeyJson);
    const unsealingInstructionsJson = JSON.stringify(UnsealingInstructions({
      allow: [{host: defaultRespondToHost}]}));
    const packagedSealedPkMessage = sealingKey.sealWithInstructions(testMessageByteArray, unsealingInstructionsJson);
    const { plaintext } = await client.unsealWithUnsealingKey({packagedSealedMessageJson: packagedSealedPkMessage.toJson()})
    expect(plaintext).toStrictEqual(testMessageByteArray);
    expect(packagedSealedPkMessage.unsealingInstructions).toBe(unsealingInstructionsJson);
  });

  test("getSecretWithHandshake", async () => {
    const client = getMockClient();
    const recipeObj = Recipe({
      requireAuthenticationHandshake: true,
      allow: [{host: defaultRespondToHost}],
      lengthInBytes: 13
    });
    const recipe = JSON.stringify(recipeObj);
    const {secretJson} = await client.getSecret({recipe});
    const secret = (await SeededCryptoModulePromise).Secret.fromJson(secretJson);
    expect(secret.secretBytes.length).toBe(13);
  });

  test("getPasswordWithHandshake", async () => {
    const client = getMockClient();
    const recipeObj = Recipe({
      requireAuthenticationHandshake: true,
      allow: [{host: defaultRespondToHost}],
      lengthInWords: 15
    });
    const {passwordJson} = await client.getPassword({recipe: JSON.stringify(recipeObj)});
    const password = (await SeededCryptoModulePromise).Password.fromJson(passwordJson)
    expect(password.recipe).toBeDefined();
    expect(password.password.length).toBeGreaterThan(15);
  });

});
