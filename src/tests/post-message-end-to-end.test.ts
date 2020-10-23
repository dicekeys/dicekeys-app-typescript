/**
 * @jest-environment jsdom
 */
import {
  ApiCalls,
  ApiFactory,
  PostMessageApiFactory,
  DerivationOptions,
  stringToUtf8ByteArray, UnsealingInstructions
} from "@dicekeys/dicekeys-api-js"

import {
  ConsentResponse, ApiRequestContext
} from '../api-handler/handle-api-request'
import { postMessageApiResponder } from "../api-handler/handle-post-message-api-request";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { jsonStringifyWithSortedFieldOrder } from "../api-handler/json";

const getUsersConsentApprove = (requestContext: ApiRequestContext): Promise<ConsentResponse> =>
  Promise.resolve({seedString: "a bogus seed", mutatedRequest: requestContext.request } );

const defaultRequestHost = "client.app";
const defaultRequestOrigin = `https://${defaultRequestHost}`;

const mockClient = (
  requestOrigin: string = defaultRequestOrigin,
  getUsersConsent: (request: ApiRequestContext) => Promise<ConsentResponse>
) => {
  const mockServer = postMessageApiResponder(
    getUsersConsent,
    (response) =>
      PostMessageApiFactory.handlePossibleResultMessage(
        {
          origin: "https://dicekeys.com",
          data: response
        } as MessageEvent
      )
  );

  return PostMessageApiFactory.postMessageApiCallFactory(
    <CALL extends ApiCalls.ApiCall>(
      request: ApiCalls.RequestMessage<CALL> & PostMessageApiFactory.PostMessageRequestMetadata 
    ): Promise<ApiCalls.ApiCallResult<CALL>> => {
      const resultPromise = PostMessageApiFactory.addPostMessageApiPromise<ApiCalls.ApiCallResult<CALL>>(request.requestId)
      
      mockServer({
        origin: requestOrigin,
        data: request
      } as MessageEvent);

      return resultPromise;
    }
  )
}

const defaultTestCall = PostMessageApiFactory.postMessageApiCallFactory(
  mockClient(defaultRequestOrigin, getUsersConsentApprove)
);
const generateSignature = ApiFactory.apiCallFactory<ApiCalls.GenerateSignature>("generateSignature", defaultTestCall);
const getSealingKey = ApiFactory.apiCallFactory<ApiCalls.GetSealingKey>("getSealingKey", defaultTestCall);
const getSecret = ApiFactory.apiCallFactory<ApiCalls.GetSecret>("getSecret", defaultTestCall);
const getPassword = ApiFactory.apiCallFactory<ApiCalls.GetPassword>("getPassword", defaultTestCall);
const getSignatureVerificationKey = ApiFactory.apiCallFactory<ApiCalls.GetSignatureVerificationKey>("getSignatureVerificationKey", defaultTestCall);
const getSigningKey = ApiFactory.apiCallFactory<ApiCalls.GetSigningKey>("getSigningKey", defaultTestCall);
const getSymmetricKey = ApiFactory.apiCallFactory<ApiCalls.GetSymmetricKey>("getSymmetricKey", defaultTestCall);
const getUnsealingKey = ApiFactory.apiCallFactory<ApiCalls.GetUnsealingKey>("getUnsealingKey", defaultTestCall);
const sealWithSymmetricKey = ApiFactory.apiCallFactory<ApiCalls.SealWithSymmetricKey>("sealWithSymmetricKey", defaultTestCall);
const unsealWithSymmetricKey = ApiFactory.apiCallFactory<ApiCalls.UnsealWithSymmetricKey>("unsealWithSymmetricKey", defaultTestCall);
const unsealWithUnsealingKey = ApiFactory.apiCallFactory<ApiCalls.UnsealWithUnsealingKey>("unsealWithUnsealingKey", defaultTestCall);


describe("End-to-end API tests using the PostMessage API", () => {

//  const loadDiceKeyAsync = () => Promise.resolve(diceKey);
//  const requestUsersConsent = (response: UsersConsentResponse) => () =>
//    new Promise<UsersConsentResponse>( (respond) => respond(response) );
 // const requestUsersConsentWillApprove = requestUsersConsent(UsersConsentResponse.Allow);

  const derivationOptionsJson = jsonStringifyWithSortedFieldOrder(DerivationOptions({
    allow: [{host: defaultRequestHost}]
  }));
  const derivationOptionsForProtectedKeysJson = jsonStringifyWithSortedFieldOrder(DerivationOptions({
    allow: [{host: defaultRequestHost}],
    clientMayRetrieveKey: true
  }));
  const testMessage = "The secret ingredient is dihydrogen monoxide";
  const testMessageByteArray = stringToUtf8ByteArray(testMessage);

  test("symmetricKeySealAndUnseal", async () => {
    const {packagedSealedMessageJson} = await sealWithSymmetricKey({
      derivationOptionsJson,
      plaintext: testMessageByteArray
    });
    const {plaintext} = await unsealWithSymmetricKey({packagedSealedMessageJson});
    expect(plaintext).toStrictEqual(testMessageByteArray);
//    packagedSealedMessage.delete();
  });

  
  test("Local symmetric key seal and remote unseal", async () => {
    const {symmetricKeyJson} = await getSymmetricKey({
      derivationOptionsJson: derivationOptionsForProtectedKeysJson
    });
    const symmetricKey = (await SeededCryptoModulePromise).SymmetricKey.fromJson(symmetricKeyJson);
    const packagedSealedMessage = symmetricKey.seal(testMessageByteArray);
    const {plaintext} = await unsealWithSymmetricKey({packagedSealedMessageJson: packagedSealedMessage.toJson()});
    expect(plaintext).toStrictEqual(testMessageByteArray);
  });

  test("Remote sign and verify", async () => {
    const {signature, signatureVerificationKeyJson: initialSignatureVerificationKeyJson} =
      (await generateSignature({derivationOptionsJson, message: testMessageByteArray}));
    const {signatureVerificationKeyJson} = await getSignatureVerificationKey({derivationOptionsJson})
    const signatureVerificationKey = (await SeededCryptoModulePromise)
      .SignatureVerificationKey.fromJson(signatureVerificationKeyJson);
    expect(signatureVerificationKey.signatureVerificationKeyBytes).toStrictEqual( (await SeededCryptoModulePromise).SignatureVerificationKey.fromJson(initialSignatureVerificationKeyJson).signatureVerificationKeyBytes);
    expect(signatureVerificationKey.verify(testMessageByteArray, signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), signature)).toBeFalsy();
    signatureVerificationKey.delete();
  });

  
  test("Local sign and verify", async () => {
    const {signingKeyJson} = await getSigningKey({derivationOptionsJson: derivationOptionsForProtectedKeysJson});
    const signingKey = (await SeededCryptoModulePromise).SigningKey.fromJson(signingKeyJson);
    const signature = signingKey.generateSignature(testMessageByteArray);
    const {signatureVerificationKeyJson} = await getSignatureVerificationKey({
      derivationOptionsJson: derivationOptionsForProtectedKeysJson
    })
    const signatureVerificationKey = (await SeededCryptoModulePromise)
      .SignatureVerificationKey.fromJson(signatureVerificationKeyJson);
    expect(signatureVerificationKey.verify(testMessageByteArray, signature)).toBeTruthy();
    expect(signatureVerificationKey.verify(Uint8Array.from([0]), signature)).toBeFalsy();
    signatureVerificationKey.delete();
  });

  test("asymmetricSealAndUnseal", async () => {
    const { sealingKeyJson } = await getSealingKey({derivationOptionsJson});
    const sealingKey = (await SeededCryptoModulePromise).SealingKey.fromJson(sealingKeyJson);
    const unsealingInstructionsJson = JSON.stringify(UnsealingInstructions({
      allow: [{host: defaultRequestHost}]
    }));
    const packagedSealedPkMessage = sealingKey.sealWithInstructions(testMessageByteArray, unsealingInstructionsJson);
    const {plaintext} = await unsealWithUnsealingKey({packagedSealedMessageJson: packagedSealedPkMessage.toJson()})
    expect(plaintext).toStrictEqual(testMessageByteArray);
    expect(packagedSealedPkMessage.unsealingInstructions).toBe(unsealingInstructionsJson);
  });

  
  test("Local Asymmetric Seal And Unseal", async () => {
    const {unsealingKeyJson} = await getUnsealingKey({
      derivationOptionsJson: derivationOptionsForProtectedKeysJson
    });
    const unsealingKey = (await SeededCryptoModulePromise).UnsealingKey.fromJson(unsealingKeyJson);
    const sealingKey = unsealingKey.getSealingKey();
    const unsealingInstructionsJson = JSON.stringify(UnsealingInstructions({
      allow: [{host: defaultRequestHost}]
    }));
    const packagedSealedPkMessage = sealingKey.sealWithInstructions(testMessageByteArray, unsealingInstructionsJson);
    const plaintext = unsealingKey.unseal(packagedSealedPkMessage);
    expect(plaintext).toStrictEqual(testMessageByteArray);
    expect(packagedSealedPkMessage.unsealingInstructions).toBe(unsealingInstructionsJson);
  });


  test("getSecret", async () => {
    const derivationOptions = DerivationOptions({
      allow: [{host: defaultRequestHost}],
      lengthInBytes: 13
    });
    const {secretJson} = await getSecret({derivationOptionsJson: JSON.stringify(derivationOptions)});
    const secret = (await SeededCryptoModulePromise).Secret.fromJson(secretJson);
    expect(secret.secretBytes.length).toBe(13);
  });

  
  test("getPassword", async () => {
    const derivationOptions = DerivationOptions({
      allow: [{host: defaultRequestHost}],
      lengthInWords: 13
    });
    const {passwordJson} = await getPassword({
      derivationOptionsJson: JSON.stringify(derivationOptions)
    });
    const password = (await SeededCryptoModulePromise).Password.fromJson(passwordJson);
    expect(derivationOptionsJson).toBeDefined();
    expect(password.password.substr(0,2)).toBe("13");
  });


});
