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

  const getMockClient = (seededCryptoModule: SeededCryptoModuleWithHelpers): Api => {
    const mockClient = new UrlApi(
      seededCryptoModule,
      "https://example.com/",
      "https://client.app/",
      /* transmit method  */
      (requestUri) => {
        const mockServerApi = new UrlPermissionCheckedMarshalledCommands(
          seededCryptoModule, requestUri, loadDiceKey, requestUsersConsentWillApprove,
          (result) => mockClient.handleResult(result)
        );
        mockServerApi.execute();
      });
    return mockClient;
  }


  const apiUrlString = "https://ThisUriIsNotEventUsedBecauseWeAreMocking/";
  const respondToUrlString = "https://myapp.ThisUriIsNotEventUsedBecauseWeAreMocking/apiresponse/";

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

  // @Test
  // fun signAndVerify() { runBlocking {
  //   val sig = api.generateSignature(derivationOptionsJson, testMessageByteArray)
  //   val signatureVerificationKey = api.getSignatureVerificationKey(derivationOptionsJson)
  //   Assert.assertArrayEquals(signatureVerificationKey.keyBytes, sig.signatureVerificationKey.keyBytes)
  //   Assert.assertTrue(signatureVerificationKey.verifySignature(testMessageByteArray, sig.signature))
  //   Assert.assertFalse(signatureVerificationKey.verifySignature(ByteArray(0), sig.signature))
  // }}

  // @Test
  // fun asymmetricSealAndUnseal() { runBlocking {
  //   val publicKey = api.getSealingKey(derivationOptionsJson)
  //   val packagedSealedPkMessage = publicKey.seal(testMessageByteArray, """{
  //          |  "requireUsersConsent": {
  //          |     "question": "Do you want use \"8fsd8pweDmqed\" as your SpoonerMail account password and remove your current password?",
  //          |     "actionButtonLabels": {
  //          |         "allow": "Make my password \"8fsd8pweDmqed\"",
  //          |         "deny": "No"
  //          |     }
  //          |  }
  //          |}""".trimMargin())
  //   val plaintext = api.unsealWithUnsealingKey(packagedSealedPkMessage)
  //   Assert.assertArrayEquals(plaintext, testMessageByteArray)
  // }}

  // @Test
  // fun getSecretWithHandshake() { runBlocking {
  //   val derivationOptions = ApiDerivationOptions().apply {
  //     requireAuthenticationHandshake = true
  //     urlPrefixesAllowed = listOf(respondToUrlString)
  //     lengthInBytes = 13
  //   }
  //   val secret = api.getSecret(derivationOptions.toJson())
  //   Assert.assertEquals(13, secret.secretBytes.size)
  // }}

});
