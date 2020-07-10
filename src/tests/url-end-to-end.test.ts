/**
 * @jest-environment jsdom
 */
import {
  DiceKey, DiceKeyInHumanReadableForm
} from "../dicekeys/dicekey";
import {
  DerivationOptions,
  UsersConsentResponse,
} from "@dicekeys/dicekeys-api-js";
import { UrlPermissionCheckedMarshalledCommands } from "../api-handler/url-permission-checked-marshalled-commands";
import { UrlApi } from "../api/url-api";
import { stringToUtf8ByteArray } from "../api/encodings";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { GetUsersApprovalOfApiCommand } from "../api-handler/permission-checked-seed-accessor";

describe("EndToEndUrlApiTests", () => {
  const diceKey = DiceKey.fromHumanReadableForm(
    "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
  )

  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    Promise.resolve(response);
  // const requestUsersConsentWillApprove = requestUsersConsent(UsersConsentResponse.Allow);
  const userConfirmation: GetUsersApprovalOfApiCommand = ({
    derivationOptionsJson
  }) => Promise.resolve({
    seedString: DiceKey.toSeedString(diceKey, DerivationOptions(derivationOptionsJson)),
    derivationOptionsJson
  });

  const defaultRequestHost = "client.app";
  const defaultRequestUrl = `https://${defaultRequestHost}`;

  const getMockClient = (
    requestUrlBase: string = defaultRequestUrl,
    respondToUrl: string = requestUrlBase,
    usersResponseToConsentRequest: UsersConsentResponse = UsersConsentResponse.Allow
  ): UrlApi => {
    const mockClient = new UrlApi(
      requestUrlBase, respondToUrl,
      /* transmit method  */
      async (requestUri) => {
        const mockServerApi = new UrlPermissionCheckedMarshalledCommands(
          requestUri,
          await SeededCryptoModulePromise,
          requestUsersConsent(usersResponseToConsentRequest),
          userConfirmation,
          (result) => mockClient.handleResult(result)
        );
        mockServerApi.execute();
      });
    return mockClient;
  }


  // const apiUrlString = "https://ThisUriIsNotEventUsedBecauseWeAreMocking/";
  // const respondToUrlString = "https://myapp.ThisUriIsNotEventUsedBecauseWeAreMocking/apiresponse/";

  // const api : Api get() {
  //   var mockedWebApi : DiceKeysWebApiClient? = null
  //   mockedWebApi = DiceKeysWebApiClient(apiUrlString, respondToUrlString) { requestUri ->
  //     runBlocking {
  //       mockApiServerCall(requestUri) { responseUri -> mockedWebApi?.handleResult(responseUri) }
  //         .executeCommand()
  //     }
  //   }
  //   return mockedWebApi!!
  // }

  const derivationOptionsJson = "{}";
  const testMessage = "The secret ingredient is dihydrogen monoxide";
  const testMessageByteArray = stringToUtf8ByteArray(testMessage);

  test("symmetricKeySealAndUnseal", async () => {
    const client = getMockClient();
    const packagedSealedMessage = await client.sealWithSymmetricKey(
      derivationOptionsJson,
      testMessageByteArray
    );
    const plaintext = await client.unsealWithSymmetricKey(packagedSealedMessage);
    expect(plaintext).toEqual(testMessageByteArray);
  });

  test("fun signAndVerify", async () => {
    const client = getMockClient();
    const sig = await client.generateSignature(derivationOptionsJson, testMessageByteArray)
    const signatureVerificationKeyFields = await client.getSignatureVerificationKey(derivationOptionsJson)
    const seededCrypto = await SeededCryptoModulePromise;
    const signatureVerificationKey = seededCrypto.SignatureVerificationKey.fromJsObject(signatureVerificationKeyFields);
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual(sig.signatureVerificationKey.signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, sig.signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), sig.signature)).toBeFalsy();
  });

  test("fun asymmetricSealAndUnseal", async () => {
    const client = getMockClient();
    const sealingKeyFields = await client.getSealingKey(derivationOptionsJson);
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
    const plaintext = await client.unsealWithUnsealingKey(packagedSealedPkMessage)
    expect(plaintext).toStrictEqual(testMessageByteArray);
    expect(packagedSealedPkMessage.unsealingInstructions).toBe(unsealingInstructionsJson);
  });

  test("getSecretWithHandshake", async () => {
    const client = getMockClient();
    const derivationOptions = DerivationOptions({
      requireAuthenticationHandshake: true,
      allow: [{host: defaultRequestHost}],
      lengthInBytes: 13
    });
    const secret = await client.getSecret(JSON.stringify(derivationOptions));
    expect(secret.secretBytes.length).toBe(13);
  });

  test("getPasswordWithHandshake", async () => {
    const client = getMockClient();
    const derivationOptions = DerivationOptions({
      requireAuthenticationHandshake: true,
      allow: [{host: defaultRequestHost}],
      lengthInBytes: 13
    });
    const {password, derivationOptionsJson} = await client.getPassword(JSON.stringify(derivationOptions));
    expect(derivationOptionsJson).toBeDefined();
    expect(password.length).toBeGreaterThan(13);
  });

});
