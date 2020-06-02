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
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import {
  PermissionCheckedSeedAccessor, ClientMayNotRetrieveKeyException
} from "../api-handler/permission-checked-seed-accessor"
import { DerivationOptions } from "../api/derivation-options";
import { PermissionCheckedMarshalledCommands } from "../api-handler/permission-checked-marshalled-commands";

describe("EndToEndUrlApiTests", () => {
  const diceKey = DiceKey.fromHumanReadableForm(
    "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
  )

  const loadDiceKey = () => new Promise<DiceKey>( resolve => resolve(diceKey));
  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    new Promise<UsersConsentResponse>( (respond) => respond(response) );
  const requestUsersConsentWillApprove = requestUsersConsent(UsersConsentResponse.Allow);

  const mockApiServerCall = async (
    requestUri: URL,
    sendResponse: (url: URL) => void
  ) => new PermissionCheckedMarshalledCommands(
    await SeededCryptoModulePromise, requestUri, loadDiceKey, requestUsersConsentWillApprove
  )

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

  // private val derivationOptionsJson = "{}"
  // private val testMessage = "The secret ingredient is dihydrogen monoxide"
  // private val testMessageByteArray = testMessage.toByteArray(Charsets.UTF_8)

  // @Test
  // fun symmetricKeySealAndUnseal()
  // {

  //   runBlocking {
  //     val packagedSealedMessage = api.sealWithSymmetricKey(
  //       derivationOptionsJson,
  //       testMessageByteArray
  //     )
  //     val plaintext = api.unsealWithSymmetricKey(packagedSealedMessage)
  //     Assert.assertArrayEquals(plaintext, testMessageByteArray)
  //   }
  // }

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
