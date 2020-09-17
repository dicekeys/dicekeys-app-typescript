/**
 * @jest-environment jsdom
 */
import {
  DerivationOptions,
} from "@dicekeys/dicekeys-api-js";
import {
  urlApiResponder
} from "../api-handler/handle-url-api-request";
import {
  UrlApi
} from "../api/url-api";
import { stringToUtf8ByteArray } from "../api/encodings";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import {
  ApiRequestContext,
  ConsentResponse 
} from "../api-handler/handle-api-request";

const getUsersConsentApprove = (requestContext: ApiRequestContext): Promise<ConsentResponse> =>
  Promise.resolve({seedString: "a bogus seed", mutatedRequest: requestContext.request } );
  
const defaultRespondToHost = "client.app";
const defaultRespondToUrl = `https://${defaultRespondToHost}/`;
const defaultServerUrl = "https://dicekeys.app/"

const getMockClient = (
  getUsersConsent: (request: ApiRequestContext) => Promise<ConsentResponse> = getUsersConsentApprove
) => {
  var client: UrlApi;
  const mockServer = urlApiResponder(
    getUsersConsent,
    (response) => client.handleResult(new URL(response))
  );
  client = new UrlApi(defaultServerUrl, defaultRespondToUrl, url => mockServer(url.toString()));
  return client;
}

describe("End To End Url Api Tests", () => {

  const derivationOptionsJson = "{}";
  const testMessage = "The secret ingredient is dihydrogen monoxide";
  const testMessageByteArray = stringToUtf8ByteArray(testMessage);

  test("symmetricKeySealAndUnseal", async () => {
    const client = getMockClient();
    const {packagedSealedMessageFields} = await client.sealWithSymmetricKey({
      derivationOptionsJson,
      plaintext: testMessageByteArray
    });
    const { plaintext } = await client.unsealWithSymmetricKey({packagedSealedMessageFields});
    expect(plaintext).toEqual(testMessageByteArray);
  });

  test("fun signAndVerify", async () => {
    const client = getMockClient();
    const sig = await client.generateSignature({
      derivationOptionsJson,
      message: testMessageByteArray
    })
    const {signatureVerificationKeyFields} = await client.getSignatureVerificationKey({derivationOptionsJson})
    const seededCrypto = await SeededCryptoModulePromise;
    const signatureVerificationKey = seededCrypto.SignatureVerificationKey.fromJsObject(signatureVerificationKeyFields);
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual(sig.signatureVerificationKeyFields.signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, sig.signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), sig.signature)).toBeFalsy();
  });

  test("fun asymmetricSealAndUnseal", async () => {
    const client = getMockClient();
    const {sealingKeyFields} = await client.getSealingKey({derivationOptionsJson});
    const seededCrypto = await SeededCryptoModulePromise;
    const sealingKey = seededCrypto.SealingKey.fromJsObject(sealingKeyFields);
    const unsealingInstructionsJson = JSON.stringify({
      "requireUsersConsent": {
          "question": "Do you want use \"8fsd8pweDmqed\" as your SpoonerMail account password and remove your current password?",
          "actionButtonLabels": {
              "allow": "Make my password \"8fsd8pweDmqed\"",
              "deny": "No"
          }
      }
    });
    const packagedSealedPkMessage = sealingKey.sealWithInstructions(testMessageByteArray, unsealingInstructionsJson);
    const { plaintext } = await client.unsealWithUnsealingKey({packagedSealedMessageFields: packagedSealedPkMessage.toJsObject()})
    expect(plaintext).toStrictEqual(testMessageByteArray);
    expect(packagedSealedPkMessage.unsealingInstructions).toBe(unsealingInstructionsJson);
  });

  test("getSecretWithHandshake", async () => {
    const client = getMockClient();
    const derivationOptions = DerivationOptions({
      requireAuthenticationHandshake: true,
      allow: [{host: defaultRespondToHost}],
      lengthInBytes: 13
    });
    const derivationOptionsJson = JSON.stringify(derivationOptions);
    const {secretFields} = await client.getSecret({derivationOptionsJson});
    expect(secretFields.secretBytes.length).toBe(13);
  });

  test("getPasswordWithHandshake", async () => {
    const client = getMockClient();
    const derivationOptions = DerivationOptions({
      requireAuthenticationHandshake: true,
      allow: [{host: defaultRespondToHost}],
      wordLimit: 15
    });
    const {password, derivationOptionsJson} = await client.getPassword({derivationOptionsJson: JSON.stringify(derivationOptions)});
    expect(derivationOptionsJson).toBeDefined();
    expect(password.length).toBeGreaterThan(15);
  });

});
