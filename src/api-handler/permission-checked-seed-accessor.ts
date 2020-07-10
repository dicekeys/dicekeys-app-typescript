import {
  ApiPermissionChecks
} from "./api-permission-checks";
import {
  DiceKeyInHumanReadableForm
} from "../dicekeys/dicekey";
import {
  ApiStrings,
  DerivationOptions,
  DerivableObjectName,
  DerivableObjectNames,
} from "@dicekeys/dicekeys-api-js";
import {
  PackagedSealedMessage
} from "@dicekeys/seeded-crypto-js";

export const commandToDerivableObjectName = (command: ApiStrings.NonMetaCommand): DerivableObjectName => {
  switch (command) {
    case "getPassword":
    case "getSecret":
      return DerivableObjectNames.Secret;
    case "getSealingKey": 
    case "getUnsealingKey":
    case "unsealWithUnsealingKey":
      return DerivableObjectNames.UnsealingKey;
    case "getSymmetricKey":
    case "sealWithSymmetricKey":
    case "unsealWithSymmetricKey":
      return DerivableObjectNames.SymmetricKey;
    case "getSigningKey":
    case "generateSignature":
    case "getSignatureVerificationKey":
          return DerivableObjectNames.SigningKey
  }
}

export class ClientMayNotRetrieveKeyException extends Error {
  constructor(public readonly type: DerivableObjectName) {
    super(`DiceKeys will only return a key of type ${type} if the derivation options set clientMayRetrieveKey to true.`)
  }
}

export interface SeedStringAndDerivationOptionsForApprovedApiCommand {
  seedString: DiceKeyInHumanReadableForm;
  derivationOptionsJson: string;
}

export interface ApiCommandParameters {
  command: ApiStrings.Command,
  host: string,
  derivationOptionsJson: string
}

export interface GetUsersApprovalOfApiCommand {
  (
    parameters: ApiCommandParameters
  ): Promise<SeedStringAndDerivationOptionsForApprovedApiCommand>
}


/**
 * This class abstracts away all permissions checks AND all access to the keySqr seed,
 * so that the only way the API which inherits from it can get to the seed is by
 * going through the permission checks.
 */
export class PermissionCheckedSeedAccessor{
  constructor(
    private readonly permissionChecks: ApiPermissionChecks,
    private getUsersApprovalOfApiCommand: GetUsersApprovalOfApiCommand
  ) {}

  /**
   * Request a seed generated from the user's DiceKey and salted by the
   * derivationOptionsJson string, using the DerivationOptions
   * specified by that string. Implements guards to ensure that the
   * keyDerivationOptionsJson allow the client application with the
   * requester's package name to perform operations with this key.
   */
  public getSeedOrThrowIfNotAuthorizedAsync = async (
    command: ApiStrings.Command,
    derivationOptionsJson: string,
    derivableObjectType: DerivableObjectName
  ): Promise<SeedStringAndDerivationOptionsForApprovedApiCommand> => {
    this.permissionChecks.throwIfClientNotAuthorized(DerivationOptions(derivationOptionsJson, derivableObjectType))
    const host = this.permissionChecks.host;
    return await this.getUsersApprovalOfApiCommand({
      command, host, derivationOptionsJson
    });
  }

  public withSeedAndUserModifiedDerivationOptions = async (
    command: ApiStrings.NonMetaCommand,
    derivationOptionsJson: string,
    fn: (seedStringAndDerivationOptions: SeedStringAndDerivationOptionsForApprovedApiCommand) => any
  ): Promise<void> => {
    this.permissionChecks.throwIfClientNotAuthorized(DerivationOptions(derivationOptionsJson, commandToDerivableObjectName(command)))
    const host = this.permissionChecks.host;
    const seedStringAndDerivationOptions = await this.getUsersApprovalOfApiCommand({
      command, host, derivationOptionsJson
    });
    await fn(seedStringAndDerivationOptions);
  }


  /**
   * Used to guard calls to the unseal operation of SymmetricKey and PrivateKey,
   * which not only needs to authorize via derivationOptionsJson, but
   * also the postDecryptionOptions in PackagedSealedMessage
   *
   * Requests a seed generated from the user's DiceKey and salted by the
   * derivationOptionsJson string, using the DerivationOptions
   * specified by that string. Implements guards to ensure that the
   * keyDerivationOptionsJson allow the client application with the
   * requester's package name to perform operations with this key.
   */
  public getSeedOrThrowIfClientNotAuthorizedToUnsealAsync = async (
    command: ApiStrings.Command,
    packagedSealedMessage: PackagedSealedMessage,
    type: DerivableObjectName
   ): Promise<SeedStringAndDerivationOptionsForApprovedApiCommand> => {
    const result = await this.getSeedOrThrowIfNotAuthorizedAsync(
      command,
      packagedSealedMessage.derivationOptionsJson, type
    );
    await this.permissionChecks.throwIfUnsealingInstructionsViolatedAsync(packagedSealedMessage.unsealingInstructions);

    return result;
  }

  /**
   * Requests a seed generated from the user's DiceKey and salted by the
   * derivationOptionsJson string, using the DerivationOptions
   * specified by that string. Implements guards to ensure that the
   * keyDerivationOptionsJson allow the client application with the
   * requester's package name to perform operations with this key.
   *
   * This is used to guard calls to APIs calls used to return raw non-public
   * keys: PrivateKey, SigningKey, or SymmetricKey. The specification only
   * allows the DiceKeys app to return these keys to the requesting app
   * if the derivationOptionsJson has `"clientMayRetrieveKey": true`.
   */
  public getSeedOrThrowIfClientsMayNotRetrieveKeysOrThisClientNotAuthorizedAsync = async (
    command: ApiStrings.Command,
    derivationOptionsJson: string,
    type: DerivableObjectName
  ): Promise<SeedStringAndDerivationOptionsForApprovedApiCommand> => {
    if (!DerivationOptions(derivationOptionsJson).clientMayRetrieveKey) {
      throw new ClientMayNotRetrieveKeyException(type)
    }
    return await this.getSeedOrThrowIfNotAuthorizedAsync(command, derivationOptionsJson, type)
  }
}