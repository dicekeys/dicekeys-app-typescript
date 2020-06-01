import {
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js"
import {
  PermissionCheckedSeedAccessor,
} from "./permission-checked-seed-accessor";
import {
  PermissionCheckedCommands
} from "./permission-checked-commands"
import {
  urlSafeBase64Decode,
  urlSafeBase64Encode
} from "../api/base64"
import * as ApiStrings from "../api/api-strings";
import {
  DiceKeyAppState
} from "./app-state-dicekey"
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  RequestForUsersConsent,
  UsersConsentResponse
} from "../api/unsealing-instructions";

const toJsonThenDelete = <T extends {toJson: () => string, delete: () => void}>(obj: T): string => {
  try {
    return obj.toJson();
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
export class PermissionCheckedMarshalledCommands {
  private readonly api: PermissionCheckedCommands;
  private successResults: [string, string][] = []

  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
    private requestUrl: URL,
    loadDiceKey: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>
  ) {
    const permissionCheckedSeedAccessor = new PermissionCheckedSeedAccessor(
      this.respondTo!,
      this.handshakeAuthenticatedUrl,
      loadDiceKey,
      requestUsersConsent,
    )
    this.api = new PermissionCheckedCommands(permissionCheckedSeedAccessor, seededCryptoModule);
  }


  protected unmarshallStringParameter = (parameterName: string): string | undefined => {
    const valueStringOrNull = this.requestUrl.searchParams.get(parameterName);
    if (valueStringOrNull == null) {
      return;
    }
    return valueStringOrNull;
  }

  protected unmarshallRequiredStringParameter = (parameterName: string) : string =>
    this.unmarshallStringParameter(parameterName)!!

  protected unmarshallBinaryParameter = (parameterName: string): Buffer | undefined => {
    const base64Value  = this.unmarshallStringParameter(parameterName);
    if (base64Value == null) return;
    return urlSafeBase64Decode(base64Value);
  }
    
  private unmarshallRequiredBinaryParameter = (parameterName: string) : Buffer =>
    this.unmarshallBinaryParameter(parameterName)!!

  protected marshallResult = (
    responseParameterName: string,
    value: string | Uint8Array
  ): PermissionCheckedMarshalledCommands => {
    this.successResults.push([
      responseParameterName,
      typeof value === "string" ?
        value :
        urlSafeBase64Encode(value)
    ]);
    return this;
  }

  private get respondTo(): string | undefined {
    return this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.respondTo)
  }

  private get authTokenFieldFromUri(): string | undefined {
    return this.unmarshallStringParameter(ApiStrings.Inputs.COMMON.authToken);
  }

  private get handshakeAuthenticatedUrl(): string | undefined {
    return this.authTokenFieldFromUri && DiceKeyAppState.instance!.getUrlForAuthenticationToken(this.authTokenFieldFromUri);
  }

  protected sendResponse = (response: [string, string][]) => {
    if (!this.respondTo) {
      return;
    }
    const newUrl = new URL(this.respondTo);
    response.forEach( ([name, value]) => {
      newUrl.searchParams.append(name, value);
    });
    window.location.replace(newUrl.toString());
  }

  protected sendSuccess = () => {
    this.marshallResult(
      ApiStrings.Outputs.COMMON.requestId,
      this.unmarshallRequiredStringParameter(ApiStrings.Inputs.COMMON.requestId)
    );
    this.sendResponse(this.successResults);
  }

  sendException = (e: Error) => {
    const requestId = this.unmarshallStringParameter(ApiStrings.Outputs.COMMON.requestId) || "";
    const exceptionName: string = (e instanceof Error) ? e.name : "unknown";
    const exceptionMessage: string = (e instanceof Error) ? e.message : "unknown";
    this.sendResponse([
      [ApiStrings.Outputs.COMMON.requestId, requestId],
      [ApiStrings.Outputs.COMMON.exception, exceptionName],
      [ApiStrings.Outputs.COMMON.exceptionMessage, exceptionMessage]
    ]);
  }

  private getCommonDerivationOptionsJsonParameter = () : string =>
    this.unmarshallRequiredStringParameter((ApiStrings.Inputs.withDerivationOptions.derivationOptionsJson))

  private getAuthToken = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getAuthToken.authToken,
    this.api.getAuthToken(this.unmarshallRequiredStringParameter(ApiStrings.Inputs.COMMON.respondTo))
  ).sendSuccess()

  private getSecret = async (): Promise<void> => this.marshallResult(
    ApiStrings.Outputs.getSecret.secret,
    toJsonThenDelete(await this.api.getSecret(this.getCommonDerivationOptionsJsonParameter()))
    ).sendSuccess()

  private sealWithSymmetricKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.sealWithSymmetricKey.packagedSealedMessage,
      toJsonThenDelete(await this.api.sealWithSymmetricKey(
        this.getCommonDerivationOptionsJsonParameter(),
        this.unmarshallRequiredBinaryParameter(ApiStrings.Inputs.sealWithSymmetricKey.plaintext),
        this.unmarshallStringParameter(ApiStrings.Inputs.sealWithSymmetricKey.unsealingInstructions)
      ))
    ).sendSuccess()

  private unsealWithSymmetricKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.unsealWithSymmetricKey.plaintext,
      await this.api.unsealWithSymmetricKey(
        this.seededCryptoModule.PackagedSealedMessage.fromJson(
          this.unmarshallRequiredStringParameter(ApiStrings.Inputs.unsealWithSymmetricKey.packagedSealedMessage)
      )
    )).sendSuccess()

  private getSealingKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.getSealingKey.sealingKey,
      toJsonThenDelete(await this.api.getSealingKey(this.getCommonDerivationOptionsJsonParameter()))
    ).sendSuccess()

  private unsealWithUnsealingKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.unsealWithUnsealingKey.plaintext,
      await this.api.unsealWithUnsealingKey(
        this.seededCryptoModule.PackagedSealedMessage.fromJson(
          this.unmarshallRequiredStringParameter(ApiStrings.Inputs.unsealWithUnsealingKey.packagedSealedMessage)
        )
      )
    ).sendSuccess()

  private getSignatureVerificationKey = async (): Promise<void> => this.marshallResult(
      ApiStrings.Outputs.getSignatureVerificationKey.signatureVerificationKey,
      toJsonThenDelete(await this.api.getSignatureVerificationKey(this.getCommonDerivationOptionsJsonParameter()))
    ).sendSuccess()

  private generateSignature = async (): Promise<void> => {
    const [signature, signatureVerificationKey] = await this.api.generateSignature(
      this.getCommonDerivationOptionsJsonParameter(),
      this.unmarshallRequiredBinaryParameter(ApiStrings.Inputs.generateSignature.message)
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

  public execute = () => {
    const command = this.unmarshallRequiredStringParameter(ApiStrings.Inputs.COMMON.command);
    this.executeCommand(command);
  }

}
