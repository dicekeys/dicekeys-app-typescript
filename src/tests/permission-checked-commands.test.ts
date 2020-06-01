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
import {JSDOM} from "jsdom";

describe("PermissionCheckedCommandsInstrumentedTest", () => {

  // beforeEach( () => {
  //     const jsdom = new JSDOM("<html></html>", {
  //       url: "https://example.com/"
  //     });
  //     global.localStorage = jsdom.window.localStorage;
  //     global.document = jsdom.window.document;
  //   }
  // );

  const diceKey = DiceKey.fromHumanReadableForm(
    "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
  )

  const loadDiceKey = () => new Promise<DiceKey>( resolve => resolve(diceKey));
  const requestUsersConsent = (response: UsersConsentResponse) => () =>
    new Promise<UsersConsentResponse>( (respond) => respond(response) );

  const getPermissionCheckedCommands = async (
    url: string,
    usersConsentResponse: UsersConsentResponse = UsersConsentResponse.Allow
  ) => 
    new PermissionCheckedCommands(
      new PermissionCheckedSeedAccessor(
        url, undefined, loadDiceKey, requestUsersConsent(usersConsentResponse)
      ),
      await SeededCryptoModulePromise
    );

test("preventsLengthExtensionAttackOnASymmetricSeal", async () => {
    await expect( async () => {
      await ( 
        (await getPermissionCheckedCommands("https://example.comspoof/"))
        .sealWithSymmetricKey(
          JSON.stringify({
         urlPrefixesAllowed: ["https://example.com/"]
          } as DerivationOptions),
          Buffer.from("The secret ingredient is sarcasm.", "utf-8"),
          JSON.stringify({
          } as UnsealingInstructions)
        )
    )}).rejects.toThrow(ClientUriNotAuthorizedException);
  });

  test("preventsLengthExtensionAttackOnASymmetricUnseal", async () => {
    await expect( async () => {
      await ( 
        (await getPermissionCheckedCommands("https://example.comspoof/"))
        .unsealWithSymmetricKey(
          new (await SeededCryptoModulePromise).PackagedSealedMessage(
            Buffer.from(""),
            JSON.stringify({urlPrefixesAllowed: ["https://example.com/"]}),
            "{}"
          ))
    )}).rejects.toThrow(ClientUriNotAuthorizedException);
  });

  test("preventsLengthExtensionAttackOnASymmetricUnsealPostDecryptionOptions", async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    const permissionCheckedCommands = await
      getPermissionCheckedCommands("https://example.comspoof/", UsersConsentResponse.Deny);
    const packagedSealedMessage = new seededCryptoModule.PackagedSealedMessage(
      Buffer.from(""),
      JSON.stringify({urlPrefixesAllowed: ["https://example.com/"]} as DerivationOptions),
      JSON.stringify({} as UnsealingInstructions)
    );
    try {
      await expect( async () => await permissionCheckedCommands.unsealWithSymmetricKey(packagedSealedMessage) )
        .rejects.toThrow(ClientUriNotAuthorizedException);
    } finally {
      packagedSealedMessage.delete();
    }
  });

  test("preventsOperationIfUsersConsentIsRequiredAndUserDeclines", async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    const permissionCheckedCommands = await
      getPermissionCheckedCommands("https://example.com/", UsersConsentResponse.Deny);
    const packagedSealedMessage = new seededCryptoModule.PackagedSealedMessage(
      Buffer.from(""),
      JSON.stringify({urlPrefixesAllowed: ["https://example.com/"]} as DerivationOptions),
      JSON.stringify({requireUsersConsent: {question: "howdy", actionButtonLabels: {allow: "a", decline: "d"}}} as UnsealingInstructions)
    );
    try {
      await expect( async () => await permissionCheckedCommands.unsealWithSymmetricKey(packagedSealedMessage) )
        .rejects.toThrow(UserDeclinedToAuthorizeOperation);
    } finally {
      packagedSealedMessage.delete();
    }
  });

  test("preventAccessToSealingKeyIfNotAuthorizedByDerivationOptions", async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    const permissionCheckedCommands = await
      getPermissionCheckedCommands("https://example.com/", UsersConsentResponse.Deny);
    await expect( async () => await permissionCheckedCommands.getUnsealingKey(
      JSON.stringify({urlPrefixesAllowed: ["https://example.com/"]} as DerivationOptions)) )
    .rejects.toThrow(ClientMayNotRetrieveKeyException);
  });

  test("allowsAccessToSealingKeyIfNotAuthorizedByDerivationOptions", async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    const permissionCheckedCommands = await
      getPermissionCheckedCommands("https://example.com/", UsersConsentResponse.Deny);
    const unsealingKey = await permissionCheckedCommands.getUnsealingKey(
      JSON.stringify({urlPrefixesAllowed: ["https://example.com/"], clientMayRetrieveKey: true} as DerivationOptions));
    unsealingKey.delete();
  });


  // @Test()
  // test("allowsPrivateKeySinceDerivationOptions", async () => {
  //     val api = new PermissionCheckedCommands(new PermissionCheckedSeedAccessor(
  //       new ApiPermissionChecks("com.example")
  //       { CompletableDeferred<UnsealingInstructions.RequestForUsersConsent.UsersResponse>(
  //         UnsealingInstructions.RequestForUsersConsent.UsersResponse.Allow
  //       ) })
  //     { CompletableDeferred(diceKey) })
  //     val privateKey = api.getUnsealingKey(
  //       ApiDerivationOptions().apply {
  //         clientMayRetrieveKey = true
  //         androidPackagePrefixesAllowed = listOf("com.example")
  //       }.toJson()
  //     )
  // }

});