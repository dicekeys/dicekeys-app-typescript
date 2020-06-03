/**
 * @jest-environment jsdom
 */
import {
  DiceKey, DiceKeyInHumanReadableForm
} from "../dicekeys/dicekey";
import {
  RequestForUsersConsent,
  UsersConsentResponse,
  UnsealingInstructions
} from "../api/unsealing-instructions";
import {
  ClientUriNotAuthorizedException,
  UserDeclinedToAuthorizeOperation
} from "../api-handler/permission-checks"
import {
  PermissionCheckedCommands
} from "../api-handler/permission-checked-commands";
import { SeededCryptoModulePromise, SeededCryptoModuleWithHelpers } from "@dicekeys/seeded-crypto-js";
import {
  PermissionCheckedSeedAccessor, ClientMayNotRetrieveKeyException
} from "../api-handler/permission-checked-seed-accessor"
import { DerivationOptions } from "../api/derivation-options";
import { PostMessagePermissionCheckedMarshalledCommands } from "../api-handler/post-message-permission-checked-marshalled-commands";
import { PostMessageApi } from "../api/post-message-api";
import { Api } from "../api/abstract-api";
import { stringToUtf8ByteArray } from "../api/encodings";

describe("End-to-end API tests using the PostMessage API", () => {
  const diceKey = DiceKey.fromHumanReadableForm(
    "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
  )

  const loadDiceKey = () => new Promise<DiceKey>( resolve => resolve(diceKey));
  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    new Promise<UsersConsentResponse>( (respond) => respond(response) );
  const requestUsersConsentWillApprove = requestUsersConsent(UsersConsentResponse.Allow);

  const defaultRequestOrigin = "https://client.app/";

  const getMockClient = (
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    requestOrigin: string = defaultRequestOrigin,
    usersResponseToConsentRequest: UsersConsentResponse = UsersConsentResponse.Allow
  ): Api => {
    const mockClient = new PostMessageApi(
      seededCryptoModule, requestOrigin, "request url would go here but is not used",
      /* transmit method  */
      (requestObject) => {
        const mockRequestMessageEvent = {
          origin: requestOrigin,
          data: requestObject
        } as MessageEvent;
        const mockServerApi = new PostMessagePermissionCheckedMarshalledCommands(
          seededCryptoModule, mockRequestMessageEvent, loadDiceKey, requestUsersConsent(usersResponseToConsentRequest),
          (data) => {
            const mockResponseMessageEvent = {
              origin: requestOrigin,
              data
            } as MessageEvent;
            mockClient.handleResult(mockResponseMessageEvent)
          });
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

  test("signAndVerify", async () => {
    const client = getMockClient(await SeededCryptoModulePromise);
    const sig = await client.generateSignature(derivationOptionsJson, testMessageByteArray)
    const signatureVerificationKey = await client.getSignatureVerificationKey(derivationOptionsJson)
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual(sig.signatureVerificationKey.signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, sig.signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), sig.signature)).toBeFalsy();
  });

  test("asymmetricSealAndUnseal", async () => {
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
      urlPrefixesAllowed: [defaultRequestOrigin],
      lengthInBytes: 13
    });
    const secret = await client.getSecret(JSON.stringify(derivationOptions));
    expect(secret.secretBytes.length).toBe(13);
  });

});
