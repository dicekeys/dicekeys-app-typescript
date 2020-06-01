
// class EndToEndUrlApiTests {
//   private fun mockLoadDiceKeyAsync(): Deferred<DiceKey> = CompletableDeferred<DiceKey>().apply {
//     complete(KeySqr.fromHumanReadableForm(
//       "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t"))
//   }

//   private fun mockRequestUsersConsentAlwaysAsync(
//     requestForUsersConsent: UnsealingInstructions.RequestForUsersConsent
//   ) : Deferred<UnsealingInstructions.RequestForUsersConsent.UsersResponse> =
//     CompletableDeferred<UnsealingInstructions.RequestForUsersConsent.UsersResponse>().apply {
//       complete(UnsealingInstructions.RequestForUsersConsent.UsersResponse.Allow)
//     }

//   private fun mockApiServerCall(
//     requestUri: Uri,
//     sendResponse: (Uri) -> Unit
//   ) = PermissionCheckedUrlCommands(
//     requestUri, ::mockLoadDiceKeyAsync, ::mockRequestUsersConsentAlwaysAsync, sendResponse
//   )

//   private val apiUrlString: String = "https://ThisUriIsNotEventUsedBecauseWeAreMocking/"
//   private val respondToUrlString: String = "https://myapp.ThisUriIsNotEventUsedBecauseWeAreMocking/apiresponse/"
//   private val api : Api get() {
//     var mockedWebApi : DiceKeysWebApiClient? = null
//     mockedWebApi = DiceKeysWebApiClient(apiUrlString, respondToUrlString) { requestUri ->
//       runBlocking {
//         mockApiServerCall(requestUri) { responseUri -> mockedWebApi?.handleResult(responseUri) }
//           .executeCommand()
//       }
//     }
//     return mockedWebApi!!
//   }

//   private val derivationOptionsJson = "{}"
//   private val testMessage = "The secret ingredient is dihydrogen monoxide"
//   private val testMessageByteArray = testMessage.toByteArray(Charsets.UTF_8)

//   @Test
//   fun symmetricKeySealAndUnseal()
//   {

//     runBlocking {
//       val packagedSealedMessage = api.sealWithSymmetricKey(
//         derivationOptionsJson,
//         testMessageByteArray
//       )
//       val plaintext = api.unsealWithSymmetricKey(packagedSealedMessage)
//       Assert.assertArrayEquals(plaintext, testMessageByteArray)
//     }
//   }

//   @Test
//   fun signAndVerify() { runBlocking {
//     val sig = api.generateSignature(derivationOptionsJson, testMessageByteArray)
//     val signatureVerificationKey = api.getSignatureVerificationKey(derivationOptionsJson)
//     Assert.assertArrayEquals(signatureVerificationKey.keyBytes, sig.signatureVerificationKey.keyBytes)
//     Assert.assertTrue(signatureVerificationKey.verifySignature(testMessageByteArray, sig.signature))
//     Assert.assertFalse(signatureVerificationKey.verifySignature(ByteArray(0), sig.signature))
//   }}

//   @Test
//   fun asymmetricSealAndUnseal() { runBlocking {
//     val publicKey = api.getSealingKey(derivationOptionsJson)
//     val packagedSealedPkMessage = publicKey.seal(testMessageByteArray, """{
//            |  "requireUsersConsent": {
//            |     "question": "Do you want use \"8fsd8pweDmqed\" as your SpoonerMail account password and remove your current password?",
//            |     "actionButtonLabels": {
//            |         "allow": "Make my password \"8fsd8pweDmqed\"",
//            |         "deny": "No"
//            |     }
//            |  }
//            |}""".trimMargin())
//     val plaintext = api.unsealWithUnsealingKey(packagedSealedPkMessage)
//     Assert.assertArrayEquals(plaintext, testMessageByteArray)
//   }}

//   @Test
//   fun getSecretWithHandshake() { runBlocking {
//     val derivationOptions = ApiDerivationOptions().apply {
//       requireAuthenticationHandshake = true
//       urlPrefixesAllowed = listOf(respondToUrlString)
//       lengthInBytes = 13
//     }
//     val secret = api.getSecret(derivationOptions.toJson())
//     Assert.assertEquals(13, secret.secretBytes.size)
//   }}

// }