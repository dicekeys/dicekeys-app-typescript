/**
 * @jest-environment jsdom
 */
import {
  DerivationOptions,
  UrlApi,
  stringToUtf8ByteArray
} from "@dicekeys/dicekeys-api-js";
import {
  urlApiResponder
} from "../api-handler/handle-url-api-request";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import {
  ApiRequestContext,
  ConsentResponse 
} from "../api-handler/handle-api-request";

const getUsersConsentApprove = (requestContext: ApiRequestContext): Promise<ConsentResponse> =>
  Promise.resolve({seedString: "a bogus seed", mutatedRequest: requestContext.request } );
  
const defaultRespondToHost = "client.app";
const defaultRespondToUrl = `https://${defaultRespondToHost}/--derived-secret-api--/handle-response`;
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
    const {seededCryptoObjectAsJson: packagedSealedMessageJson} = await client.sealWithSymmetricKey({
      derivationOptionsJson,
      plaintext: testMessageByteArray
    });
    const { plaintext } = await client.unsealWithSymmetricKey({packagedSealedMessageJson});
    expect(plaintext).toEqual(testMessageByteArray);
  });

  test("fun signAndVerify", async () => {
    const client = getMockClient();
    const sig = await client.generateSignature({
      derivationOptionsJson,
      message: testMessageByteArray
    })
    const {seededCryptoObjectAsJson: signatureVerificationKeyJson} = await client.getSignatureVerificationKey({derivationOptionsJson})
    const seededCrypto = await SeededCryptoModulePromise;
    const signatureVerificationKey = seededCrypto.SignatureVerificationKey.fromJson(signatureVerificationKeyJson);
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual( (await SeededCryptoModulePromise).SignatureVerificationKey.fromJson(sig.seededCryptoObjectAsJson).signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, sig.signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), sig.signature)).toBeFalsy();
  });

  test("fun asymmetricSealAndUnseal", async () => {
    const client = getMockClient();
    const {seededCryptoObjectAsJson: sealingKeyJson} = await client.getSealingKey({derivationOptionsJson});
    const seededCrypto = await SeededCryptoModulePromise;
    const sealingKey = seededCrypto.SealingKey.fromJson(sealingKeyJson);
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
    const { plaintext } = await client.unsealWithUnsealingKey({packagedSealedMessageJson: packagedSealedPkMessage.toJson()})
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
    const {seededCryptoObjectAsJson: secretJson} = await client.getSecret({derivationOptionsJson});
    const secret = (await SeededCryptoModulePromise).Secret.fromJson(secretJson);
    expect(secret.secretBytes.length).toBe(13);
  });

  test("getPasswordWithHandshake", async () => {
    const client = getMockClient();
    const derivationOptions = DerivationOptions({
      requireAuthenticationHandshake: true,
      allow: [{host: defaultRespondToHost}],
      lengthInWords: 15
    });
    const {seededCryptoObjectAsJson: passwordJson} = await client.getPassword({derivationOptionsJson: JSON.stringify(derivationOptions)});
    const password = (await SeededCryptoModulePromise).Password.fromJson(passwordJson)
    expect(password.derivationOptionsJson).toBeDefined();
    expect(password.password.length).toBeGreaterThan(15);
  });

});
