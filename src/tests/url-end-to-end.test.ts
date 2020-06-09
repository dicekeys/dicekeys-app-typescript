/**
 * @jest-environment jsdom
 */
import {
  DiceKey, DiceKeyInHumanReadableForm
} from "../dicekeys/dicekey";
import {
  SeededCryptoModulePromise,
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  UsersConsentResponse,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import { UrlPermissionCheckedMarshalledCommands } from "../api-handler/url-permission-checked-marshalled-commands";
import { UrlApi } from "../api/url-api";
import { Api } from "../api/abstract-api";
import { stringToUtf8ByteArray } from "../api/encodings";

describe("EndToEndUrlApiTests", () => {
  const diceKey = DiceKey.fromHumanReadableForm(
    "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
  )

  const loadDiceKey = () => new Promise<DiceKey>( resolve => resolve(diceKey));
  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    new Promise<UsersConsentResponse>( (respond) => respond(response) );
  const requestUsersConsentWillApprove = requestUsersConsent(UsersConsentResponse.Allow);

  const defaultRequestUrl = "https://client.app/";

  const getMockClient = (
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    requestUrlBase: string = defaultRequestUrl,
    respondToUrl: string = requestUrlBase,
    usersResponseToConsentRequest: UsersConsentResponse = UsersConsentResponse.Allow
  ): Api => {
    const mockClient = new UrlApi(
      requestUrlBase, respondToUrl,
      /* transmit method  */
      (requestUri) => {
        const mockServerApi = new UrlPermissionCheckedMarshalledCommands(
          requestUri, loadDiceKey, requestUsersConsent(usersResponseToConsentRequest),
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
    const client = getMockClient(await SeededCryptoModulePromise);
    const packagedSealedMessage = await client.sealWithSymmetricKey(
      derivationOptionsJson,
      testMessageByteArray
    );
    const plaintext = await client.unsealWithSymmetricKey(packagedSealedMessage);
    // expect(testMessageByteArray).toEqual(plaintext);
    packagedSealedMessage.delete();

  });

  test("fun signAndVerify", async () => {
    const client = getMockClient(await SeededCryptoModulePromise);
    const sig = await client.generateSignature(derivationOptionsJson, testMessageByteArray)
    const signatureVerificationKey = await client.getSignatureVerificationKey(derivationOptionsJson)
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual(sig.signatureVerificationKey.signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, sig.signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), sig.signature)).toBeFalsy();
  });

  test("fun asymmetricSealAndUnseal", async () => {
    const client = getMockClient(await SeededCryptoModulePromise);
    const publicKey = await client.getSealingKey(derivationOptionsJson);
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
    const plaintext = await client.unsealWithUnsealingKey(packagedSealedPkMessage)
    expect(plaintext).toStrictEqual(testMessageByteArray);
    expect(packagedSealedPkMessage.unsealingInstructions).toBe(unsealingInstructionsJson);
  });

  test("getSecretWithHandshake", async () => {
    const client = getMockClient(await SeededCryptoModulePromise);
    const derivationOptions = DerivationOptions({
      requireAuthenticationHandshake: true,
      urlPrefixesAllowed: [defaultRequestUrl],
      lengthInBytes: 13
    });
    const secret = await client.getSecret(JSON.stringify(derivationOptions));
    expect(secret.secretBytes.length).toBe(13);
  });

});
