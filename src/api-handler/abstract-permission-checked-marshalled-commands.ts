import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js"
import {
  PermissionCheckedSeedAccessor,
} from "./permission-checked-seed-accessor";
import {
  PermissionCheckedCommands
} from "./permission-checked-commands"
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  ApiStrings,
  RequestForUsersConsent,
  UsersConsentResponse
} from "@dicekeys/dicekeys-api-js";

const toJsonThenDelete = <T extends {toJson: () => string, delete: () => void}>(obj: T): string => {
  try {
    const result = obj.toJson();
    return result;
  } finally {
    obj.delete();
  }
}

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
  private successResults: [string, string | Uint8Array][] = []
  /**
   * The api abstracts away the lower levels of the API and access to the
   * underlying cryptographic seed, so that this module never has to import
   * the seed itself.
   */
  private readonly api: PermissionCheckedCommands;

  constructor(
    private origin: string,
    loadDiceKeyAsync: () => PromiseLike<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>,
    protocolMayRequireHandshakes: boolean,
    handshakeAuthenticatedUrl: string = ""
  ) {
    const permissionCheckedSeedAccessor = new PermissionCheckedSeedAccessor(
      origin,
      loadDiceKeyAsync,
      requestUsersConsent,
      protocolMayRequireHandshakes,
      handshakeAuthenticatedUrl
    )
    this.api = new PermissionCheckedCommands(permissionCheckedSeedAccessor);
  }

  protected abstract unmarshallOptionalStringParameter(parameterName: string): string | undefined;
  protected abstract unmarshallBinaryParameter(parameterName: string): Uint8Array;

  protected unmarshallStringParameter = (parameterName: string) : string =>
    this.unmarshallOptionalStringParameter(parameterName) ?? 
      (() => { throw new Error("Missing parameter"); })()


  protected marshallResult = (
    responseParameterName: string,
    value: string | Uint8Array
  ): PermissionCheckedMarshalledCommands => {
    this.successResults.push([
      responseParameterName, value]);
    return this;
  }

  protected abstract sendResponse(response: [string, string | Uint8Array][]): any;

  protected sendSuccess = (): void => {
    this.marshallResult(
      ApiStrings.Outputs.COMMON.requestId,
      this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.requestId)
    );
    this.sendResponse(this.successResults);
  }

  sendException = (e: Error): void => {
    const requestId = this.unmarshallOptionalStringParameter(ApiStrings.Outputs.COMMON.requestId) || "";
    const exceptionName: string = (e instanceof Error) ? e.name : "unknown";
    const exceptionMessage: string = (e instanceof Error) ? e.message : "unknown";
    this.sendResponse([
      [ApiStrings.Outputs.COMMON.requestId, requestId],
      [ApiStrings.Outputs.COMMON.exception, exceptionName],
      [ApiStrings.Outputs.COMMON.exceptionMessage, exceptionMessage]
    ]);
  }

  private getCommonDerivationOptionsJsonParameter = () : string =>
    this.unmarshallStringParameter((ApiStrings.Inputs.withDerivationOptions.derivationOptionsJson))

  private getAuthToken = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getAuthToken.authToken,
    this.api.getAuthToken(this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.respondTo))
  ).sendSuccess()

  private getSecret = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getSecret.secret,
    toJsonThenDelete(await this.api.getSecret(this.getCommonDerivationOptionsJsonParameter()))
    ).sendSuccess()

  private sealWithSymmetricKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.sealWithSymmetricKey.packagedSealedMessage,
      toJsonThenDelete(await this.api.sealWithSymmetricKey(
        this.getCommonDerivationOptionsJsonParameter(),
        this.unmarshallBinaryParameter(ApiStrings.Inputs.sealWithSymmetricKey.plaintext),
        this.unmarshallOptionalStringParameter(ApiStrings.Inputs.sealWithSymmetricKey.unsealingInstructions)
      ))
    ).sendSuccess()

  private unsealWithSymmetricKey = async (): Promise<void> => {
    const json = this.unmarshallStringParameter(ApiStrings.Inputs.unsealWithSymmetricKey.packagedSealedMessage);
    const packagedSealedMessage = (await SeededCryptoModulePromise).PackagedSealedMessage.fromJson(json);
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

  private getSealingKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.getSealingKey.sealingKey,
      toJsonThenDelete(await this.api.getSealingKey(this.getCommonDerivationOptionsJsonParameter()))
    ).sendSuccess()


  private unsealWithUnsealingKey = async (): Promise<void> => {
    const json = this.unmarshallStringParameter(ApiStrings.Inputs.unsealWithSymmetricKey.packagedSealedMessage);
    const packagedSealedMessage =(await SeededCryptoModulePromise).PackagedSealedMessage.fromJson(json);
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
  
  private getSignatureVerificationKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.getSignatureVerificationKey.signatureVerificationKey,
      toJsonThenDelete(await this.api.getSignatureVerificationKey(this.getCommonDerivationOptionsJsonParameter()))
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
          signatureVerificationKey.toJson()
      ).sendSuccess()
    } finally {
      signatureVerificationKey.delete();
    }
  }

  private getUnsealingKey = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getUnsealingKey.unsealingKey,
    toJsonThenDelete(await this.api.getUnsealingKey(this.getCommonDerivationOptionsJsonParameter()))
  ).sendSuccess()

  private getSigningKey = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getSigningKey.signingKey,
    toJsonThenDelete(await this.api.getSigningKey(this.getCommonDerivationOptionsJsonParameter()))
  ).sendSuccess()

  private getSymmetricKey = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getSymmetricKey.symmetricKey,
    toJsonThenDelete(await this.api.getSymmetricKey(this.getCommonDerivationOptionsJsonParameter()))
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
      this.sendException(e)
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
