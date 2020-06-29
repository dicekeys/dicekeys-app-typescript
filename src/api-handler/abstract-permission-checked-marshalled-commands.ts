import {
  PackagedSealedMessage,
  Secret,
  SymmetricKey,
  UnsealingKey, SealingKey,
  SigningKey, SignatureVerificationKey,
  PackagedSealedMessageStatic,
  SecretStatic,
  SymmetricKeyStatic,
  UnsealingKeyStatic, SealingKeyStatic,
  SigningKeyStatic, SignatureVerificationKeyStatic,
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js"
import {
  PermissionCheckedSeedAccessor,
  GetUsersApprovalOfApiCommand
} from "./permission-checked-seed-accessor";
import {
  PermissionCheckedCommands
} from "./permission-checked-commands"
import {
  ApiStrings,
  Exceptions,
  SeededCryptoJsObject,
} from "@dicekeys/dicekeys-api-js";
import {
  SeededCryptoSerializableObjectStatics
} from "@dicekeys/seeded-crypto-js";
import {
  ApiPermissionChecks
} from "./api-permission-checks";

export type SeededCryptoObject =
  PackagedSealedMessage |
  Secret |
  SymmetricKey |
  UnsealingKey | SealingKey |
  SigningKey | SignatureVerificationKey;
(() => {
  // Code here only for typing to test that there's a member of 
  // SeededCryptoObject implements an interface in SeededCryptoJsObject
  const seededCryptoObject = undefined as unknown as SeededCryptoObject;
  const testThatAllSeededCryptoObjectsHaveJsEquivalaents: SeededCryptoJsObject = seededCryptoObject;
  console.log(testThatAllSeededCryptoObjectsHaveJsEquivalaents);
})
export type SeededCryptoObjectStatic =
  PackagedSealedMessageStatic |
  SecretStatic |
  SymmetricKeyStatic |
  UnsealingKeyStatic | SealingKeyStatic |
  SigningKeyStatic | SignatureVerificationKeyStatic;

// export type ResponseParameterValue = string | Uint8Array | SeededCryptoJsObject
// export type ResponseParameterNameValuePairs = [string,  ResponseParameterValue][];


export class InvalidDiceKeysCommandException extends Error {
  constructor(candidateCommand: string) {
    super(`The command ${candidateCommand} is not implemented.`)
  }
}

/**
 * Wrap the [PermissionCheckedCommands] to unmarshall parameters from the
 * Android Intents (e.g. via `getStringExtra` or `getByteArrayExtra`) and then
 * marshall the Api call's result into a result intent (e.g. via `putExtra`).
 *
 *  The caller is responsible for catching exceptions and marshalling them
 */
export abstract class PermissionCheckedMarshalledCommands {
//  private successResults: ResponseParameterNameValuePairs = []
  /**
   * The api abstracts away the lower levels of the API and access to the
   * underlying cryptographic seed, so that this module never has to import
   * the seed itself.
   */
  private readonly api: PermissionCheckedCommands;

  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
    permissionChecks: ApiPermissionChecks,
    getUsersApprovalOfApiCommand: GetUsersApprovalOfApiCommand
  ) {
    const permissionCheckedSeedAccessor = new PermissionCheckedSeedAccessor(
      permissionChecks,
      getUsersApprovalOfApiCommand
    )
    this.api = new PermissionCheckedCommands(seededCryptoModule, permissionCheckedSeedAccessor);
  }

  protected abstract unmarshallOptionalStringParameter(
    parameterName: string
  ): string | undefined;
  protected abstract unmarshallBinaryParameter(
    parameterName: string
  ): Uint8Array;
  protected abstract unmarshallSeededCryptoObject<
    FIELDS extends SeededCryptoJsObject,
    OBJECT extends SeededCryptoObject
  >(
    objStatic: SeededCryptoSerializableObjectStatics<FIELDS, OBJECT>,
    parameterName: string
  ): OBJECT;


  protected unmarshallStringParameter = (parameterName: string) : string =>
    this.unmarshallOptionalStringParameter(parameterName) ?? 
      (() => { throw Exceptions.MissingParameter.create(parameterName); })()


  protected abstract marshallResult(
    responseParameterName: string,
    value: string | Uint8Array | SeededCryptoObject
  ): PermissionCheckedMarshalledCommands;
  protected abstract clearMarshalledResults(): void;
  //  => {
  //   this.successResults.push([
  //     responseParameterName, value]);
  //   return this;
  // }

  marshallSeededCryptoObjectResultThenDeleteIt = <T extends SeededCryptoObject>(
    responseParameterName: string,
    obj: T
  ): PermissionCheckedMarshalledCommands => {
    try {
      return this.marshallResult(responseParameterName, obj);
    } finally {
      obj.delete();
    }
  }




  protected abstract sendResponse(): void;

  protected sendSuccess = (): void => {
    this.marshallResult(
      ApiStrings.Outputs.COMMON.requestId,
      this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.requestId)
    );
    this.sendResponse();
  }

  sendException = (e: Error): void => {
    const requestId = this.unmarshallOptionalStringParameter(ApiStrings.Outputs.COMMON.requestId) || "";
    const exceptionName: string = (e instanceof Error) ? e.name : "unknown";
    const exceptionMessage: string = (e instanceof Error) ? e.message : "unknown";
    this.clearMarshalledResults();
    this.marshallResult(ApiStrings.Outputs.COMMON.requestId, requestId);
    this.marshallResult(ApiStrings.Outputs.COMMON.exception, exceptionName);
    this.marshallResult(ApiStrings.Outputs.COMMON.exceptionMessage, exceptionMessage);
    this.sendResponse();
  }

  private getCommonDerivationOptionsJsonParameter = () : string =>
    this.unmarshallStringParameter((ApiStrings.Inputs.withDerivationOptions.derivationOptionsJson))

  private getAuthToken = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getAuthToken.authToken,
    this.api.getAuthToken(this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.respondTo))
  ).sendSuccess()

  private getSecret = async (): Promise<void> => this.marshallSeededCryptoObjectResultThenDeleteIt(
      ApiStrings.Outputs.getSecret.secret,
      await this.api.getSecret(this.getCommonDerivationOptionsJsonParameter())
    ).sendSuccess()

  private sealWithSymmetricKey = async (): Promise<void> =>
    this.marshallSeededCryptoObjectResultThenDeleteIt(
      ApiStrings.Outputs.sealWithSymmetricKey.packagedSealedMessage,
      await this.api.sealWithSymmetricKey(
        this.getCommonDerivationOptionsJsonParameter(),
        this.unmarshallBinaryParameter(ApiStrings.Inputs.sealWithSymmetricKey.plaintext),
        this.unmarshallOptionalStringParameter(ApiStrings.Inputs.sealWithSymmetricKey.unsealingInstructions)
      )
    ).sendSuccess()

  private unsealWithSymmetricKey = async (): Promise<void> => {
    const packagedSealedMessage = this.unmarshallSeededCryptoObject(
      this.seededCryptoModule.PackagedSealedMessage,
      ApiStrings.Inputs.unsealWithSymmetricKey.packagedSealedMessage
    );
    try {
      return this.marshallResult(
        ApiStrings.Outputs.unsealWithSymmetricKey.plaintext,
        await this.api.unsealWithSymmetricKey(
        packagedSealedMessage
      )).sendSuccess()
    } finally {
      packagedSealedMessage.delete()
    }
  }

  private getSealingKey = async (): Promise<void> =>
    this.marshallSeededCryptoObjectResultThenDeleteIt(
      ApiStrings.Outputs.getSealingKey.sealingKey,
      await this.api.getSealingKey(this.getCommonDerivationOptionsJsonParameter())
    ).sendSuccess()


  private unsealWithUnsealingKey = async (): Promise<void> => {
    const packagedSealedMessage = this.unmarshallSeededCryptoObject(
      this.seededCryptoModule.PackagedSealedMessage,
      ApiStrings.Inputs.unsealWithSymmetricKey.packagedSealedMessage
    );
    try {
      return this.marshallResult(
        ApiStrings.Outputs.unsealWithUnsealingKey.plaintext,
        await this.api.unsealWithUnsealingKey(
          packagedSealedMessage
      )).sendSuccess()
    } finally {
      packagedSealedMessage.delete();
    }
  }
  
  private getSignatureVerificationKey = async (): Promise<void> => this.marshallSeededCryptoObjectResultThenDeleteIt(
      ApiStrings.Outputs.getSignatureVerificationKey.signatureVerificationKey,
      await this.api.getSignatureVerificationKey(this.getCommonDerivationOptionsJsonParameter())
    ).sendSuccess()

  private generateSignature = async (): Promise<void> => {
    const [signature, signatureVerificationKey] = await this.api.generateSignature(
      this.getCommonDerivationOptionsJsonParameter(),
      this.unmarshallBinaryParameter(ApiStrings.Inputs.generateSignature.message)
    );
    try {
      this.marshallResult(
        ApiStrings.Outputs.generateSignature.signature, signature
      ).marshallResult(
          ApiStrings.Outputs.generateSignature.signatureVerificationKey,
          signatureVerificationKey
      ).sendSuccess()
    } finally {
      signatureVerificationKey.delete();
    }
  }

  private getUnsealingKey = async (): Promise<void> =>
    this.marshallSeededCryptoObjectResultThenDeleteIt(
      ApiStrings.Outputs.getUnsealingKey.unsealingKey,
      await this.api.getUnsealingKey(this.getCommonDerivationOptionsJsonParameter())
    ).sendSuccess()

  private getSigningKey = async (): Promise<void> =>
    this.marshallSeededCryptoObjectResultThenDeleteIt(
      ApiStrings.Outputs.getSigningKey.signingKey,
      await this.api.getSigningKey(this.getCommonDerivationOptionsJsonParameter())
    ).sendSuccess()

  private getSymmetricKey = async (): Promise<void> =>
    this.marshallSeededCryptoObjectResultThenDeleteIt(
      ApiStrings.Outputs.getSymmetricKey.symmetricKey,
      await this.api.getSymmetricKey(this.getCommonDerivationOptionsJsonParameter())
    ).sendSuccess()

  protected executeCommand = (command: string) => {
    try {
      if (ApiStrings.isCommand(command)) {
        const commandImplementation = this[command];
        return commandImplementation();
      } else {
          throw new InvalidDiceKeysCommandException(command);
      }
    } catch (e) {
      this.sendException(e);
      return;
    }
  }

  public isCommand = () => {
    const command = this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.command);
    return command && command in ApiStrings.Commands;
  }

  public execute = (): Promise<void> | undefined  => {
    const command = this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.command);
    return this.executeCommand(command);
  }

}
