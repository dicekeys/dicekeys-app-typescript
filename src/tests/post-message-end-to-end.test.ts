/**
 * @jest-environment jsdom
 */
import {
  ApiFactory,
  PostMessageApiFactory,
  UsersConsentResponse,
  DerivationOptions,
} from "@dicekeys/dicekeys-api-js"

 import {
  DiceKey, DiceKeyInHumanReadableForm
} from "../dicekeys/dicekey";
import { PostMessagePermissionCheckedMarshalledCommands } from "../api-handler/post-message-permission-checked-marshalled-commands";
import { Api } from "../api/abstract-api";
import { stringToUtf8ByteArray } from "../api/encodings";

const diceKey = DiceKey.fromHumanReadableForm(
  "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
);
const loadDiceKey = () => new Promise<DiceKey>( resolve => resolve(diceKey));
const requestUsersConsent = (response: UsersConsentResponse) => () =>
  new Promise<UsersConsentResponse>( (respond) => respond(response) );
const requestUsersConsentWillApprove = requestUsersConsent(UsersConsentResponse.Allow);

const defaultRequestOrigin = "https://client.app/";

const mockTransmitRequestFunction = (
  requestOrigin: string = defaultRequestOrigin,
  usersResponseToConsentRequest: UsersConsentResponse = UsersConsentResponse.Allow
): PostMessageApiFactory.TransmitRequestFunction =>
  (requestObject) => {
    return new Promise<MessageEvent>( (resolve, reject) => {
      try {
        const mockServerApi = new PostMessagePermissionCheckedMarshalledCommands(
          {
            origin: requestOrigin,
            data: requestObject
          } as MessageEvent,
          loadDiceKey,requestUsersConsent(usersResponseToConsentRequest),
          (data) => {
            const mockResponseMessageEvent: MessageEvent = {
              origin: requestOrigin,
              data
            } as MessageEvent;
            resolve(mockResponseMessageEvent);
          });
        mockServerApi.execute();
      } catch (e) {
        reject(e);
      }
    });
  };

const defaultTestCall = PostMessageApiFactory.postMessageApiCallFactory(
  mockTransmitRequestFunction(defaultRequestOrigin, UsersConsentResponse.Allow)
);
const generateSignature = ApiFactory.generateSignatureFactory(defaultTestCall);
const getSealingKey = ApiFactory.getSealingKeyFactory(defaultTestCall);
const getSecret = ApiFactory.getSecretFactory(defaultTestCall);
const getSignatureVerificationKey = ApiFactory.getSignatureVerificationKeyFactory(defaultTestCall);
const getSigningKey = ApiFactory.getSigningKeyFactory(defaultTestCall);
const getSymmetricKey = ApiFactory.getSymmetricKeyFactory(defaultTestCall);
const getUnsealingKey = ApiFactory.getUnsealingKeyFactory(defaultTestCall);
const sealWithSymmetricKey = ApiFactory.sealWithSymmetricKeyFactory(defaultTestCall);
const unsealWithSymmetricKey = ApiFactory.unsealWithSymmetricKeyFactory(defaultTestCall);
const unsealWithUnsealingKey = ApiFactory.unsealWithUnsealingKeyFactory(defaultTestCall);


describe("End-to-end API tests using the PostMessage API", () => {
  const diceKey = DiceKey.fromHumanReadableForm(
    "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
  )

  const loadDiceKey = () => new Promise<DiceKey>( resolve => resolve(diceKey));
  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    new Promise<UsersConsentResponse>( (respond) => respond(response) );
  const requestUsersConsentWillApprove = requestUsersConsent(UsersConsentResponse.Allow);

  const defaultRequestOrigin = "https://client.app/";

  const derivationOptionsJson = "{}";
  const testMessage = "The secret ingredient is dihydrogen monoxide";
  const testMessageByteArray = stringToUtf8ByteArray(testMessage);

  test("symmetricKeySealAndUnseal", async () => {
    const packagedSealedMessage = await sealWithSymmetricKey(
      derivationOptionsJson,
      testMessageByteArray
    );
    const plaintext = await unsealWithSymmetricKey(packagedSealedMessage);
    // expect(testMessageByteArray).toEqual(plaintext);
    packagedSealedMessage.delete();

  });

  test("signAndVerify", async () => {
    const sig = await generateSignature(derivationOptionsJson, testMessageByteArray)
    const signatureVerificationKey = await getSignatureVerificationKey(derivationOptionsJson)
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual(sig.signatureVerificationKey.signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, sig.signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), sig.signature)).toBeFalsy();
  });

  test("asymmetricSealAndUnseal", async () => {
    const publicKey = await getSealingKey(derivationOptionsJson);
    const unsealingInstructionsJson = JSON.stringify({
      "requireUsersConsent": {
          "question": "Do you want use \"8fsd8pweDmqed\" as your SpoonerMail account password and remove your current password?",
          "actionButtonLabels": {
              "allow": "Make my password \"8fsd8pweDmqed\"",
              "deny": "No"
          }
      }
    });
    const packagedSealedPkMessage = publicKey.sealWithInstructions(testMessageByteArray, unsealingInstructionsJson);
    const plaintext = await unsealWithUnsealingKey(packagedSealedPkMessage)
    expect(plaintext).toStrictEqual(testMessageByteArray);
    expect(packagedSealedPkMessage.unsealingInstructions).toBe(unsealingInstructionsJson);
  });

  test("getSecretWithHandshake", async () => {
    const derivationOptions = DerivationOptions({
      requireAuthenticationHandshake: true,
      urlPrefixesAllowed: [defaultRequestOrigin],
      lengthInBytes: 13
    });
    const secret = await getSecret(JSON.stringify(derivationOptions));
    expect(secret.secretBytes.length).toBe(13);
  });

});
