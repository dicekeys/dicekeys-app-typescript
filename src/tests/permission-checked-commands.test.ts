/**
 * @jest-environment jsdom
 */

 import {
  DiceKey, DiceKeyInHumanReadableForm
} from "../dicekeys/dicekey";
import {
  Exceptions,
  UsersConsentResponse,
  UnsealingInstructions,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  PermissionCheckedCommands
} from "../api-handler/permission-checked-commands";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import {
  PermissionCheckedSeedAccessor, ClientMayNotRetrieveKeyException, GetUsersApprovalOfApiCommand
} from "../api-handler/permission-checked-seed-accessor"
import {
  stringToUtf8ByteArray
} from "../api/encodings";
import {
  ApiPermissionChecks, RequestForUsersConsentFn
} from "../api-handler/api-permission-checks";

describe("PermissionCheckedCommandsInstrumentedTest", () => {

  const diceKey = DiceKey.fromHumanReadableForm(
    "A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm
  )

  const requestUsersConsent: (response: UsersConsentResponse) => RequestForUsersConsentFn =
      (response: UsersConsentResponse) => () => Promise.resolve(response);
  const getUsersApprovalOfApiCommand: GetUsersApprovalOfApiCommand = ({derivationOptionsJson}) => Promise.resolve({
      seedString: DiceKey.toSeedString(diceKey, DerivationOptions(derivationOptionsJson)),
      derivationOptionsJson
    });
  
  const getPermissionCheckedCommands = async (
    url: string,
    usersConsentResponse: UsersConsentResponse = UsersConsentResponse.Allow
  ) => 
    new PermissionCheckedCommands(
      await SeededCryptoModulePromise,
      new PermissionCheckedSeedAccessor(
        new ApiPermissionChecks(new URL(url).host,
        requestUsersConsent(usersConsentResponse)
      ),
      getUsersApprovalOfApiCommand,
    )
  );

  test("getPassword", async () => {
    const commands = await getPermissionCheckedCommands("https://example.com/");
    const originalDerivationOptionsJson = JSON.stringify(DerivationOptions({
      allow: [{host: "example.com"}]
    }));
    const {password, derivationOptionsJson}= await commands.getPassword(originalDerivationOptionsJson, 5);
    expect(password.split(" ").length).toBe(5);
    expect(derivationOptionsJson).toBe(originalDerivationOptionsJson)
  });
      
  test("preventsLengthExtensionAttackOnASymmetricSeal", async () => {
    await expect( async () => {
      await ( 
        (await getPermissionCheckedCommands("https://example.comspoof/"))
        .sealWithSymmetricKey(
          JSON.stringify(DerivationOptions({
            allow: [{host: "example.com"}]
          })),
          stringToUtf8ByteArray("The secret ingredient is sarcasm."),
          JSON.stringify({
          } as UnsealingInstructions)
        )
    )}).rejects.toThrow(Exceptions.ClientNotAuthorizedException);
  });

  test("preventsLengthExtensionAttackOnASymmetricUnseal", async () => {
    await expect( async () => {
      await (await getPermissionCheckedCommands("https://example.comspoof/"))
        .unsealWithSymmetricKey(
          new (await SeededCryptoModulePromise).PackagedSealedMessage(
            stringToUtf8ByteArray(""),
            JSON.stringify(DerivationOptions({allow: [{host: "example.com"}]})),
            "{}"
          ))
    }).rejects.toThrow(Exceptions.ClientNotAuthorizedException);
  });

  test("preventsLengthExtensionAttackOnASymmetricUnsealPostDecryptionOptions", async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    const permissionCheckedCommands =
      await getPermissionCheckedCommands("https://example.comspoof/", UsersConsentResponse.Deny);
    const packagedSealedMessage = new seededCryptoModule.PackagedSealedMessage(
      stringToUtf8ByteArray(""),
      JSON.stringify(DerivationOptions({allow: [{host: "example.com"}]})),
      JSON.stringify({} as UnsealingInstructions)
    );
    try {
      await expect( async () => await permissionCheckedCommands.unsealWithSymmetricKey(packagedSealedMessage) )
        .rejects.toThrow(Exceptions.ClientNotAuthorizedException);
    } finally {
      packagedSealedMessage.delete();
    }
  });

  test("preventsOperationIfUsersConsentIsRequiredAndUserDeclines", async () => {
    const seededCryptoModule = await SeededCryptoModulePromise;
    const permissionCheckedCommands = await
      getPermissionCheckedCommands("https://example.com/", UsersConsentResponse.Deny);
    const packagedSealedMessage = new seededCryptoModule.PackagedSealedMessage(
      stringToUtf8ByteArray(""),
      JSON.stringify(DerivationOptions({allow: [{host: "example.com"}]})),
      JSON.stringify({requireUsersConsent: {question: "howdy", actionButtonLabels: {allow: "a", decline: "d"}}} as UnsealingInstructions)
    );
    try {
      await expect( async () => await permissionCheckedCommands.unsealWithSymmetricKey(packagedSealedMessage) )
        .rejects.toThrow(Exceptions.UserDeclinedToAuthorizeOperation);
    } finally {
      packagedSealedMessage.delete();
    }
  });

  test("preventAccessToSealingKeyIfNotAuthorizedByDerivationOptions", async () => {
    const permissionCheckedCommands = await
      getPermissionCheckedCommands("https://example.com/", UsersConsentResponse.Deny);
    await expect( async () => await permissionCheckedCommands.getUnsealingKey(
      JSON.stringify(DerivationOptions({allow: [{host: "example.com"}]}))) )
    .rejects.toThrow(ClientMayNotRetrieveKeyException);
  });

  test("allowsAccessToSealingKeyIfNotAuthorizedByDerivationOptions", async () => {
    const permissionCheckedCommands = await
      getPermissionCheckedCommands("https://example.com/", UsersConsentResponse.Deny);
    const unsealingKey = await permissionCheckedCommands.getUnsealingKey(
      JSON.stringify(DerivationOptions({allow: [{host: "example.com"}], clientMayRetrieveKey: true})));
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