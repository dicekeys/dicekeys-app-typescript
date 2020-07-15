import {
  ApiStrings,
  ApiFactory,
  ApiCalls,
  DerivationOptions,
  Exceptions
} from "@dicekeys/dicekeys-api-js"
import {
  urlSafeBase64Decode,
  urlSafeBase64Encode
} from "./encodings";
import { Commands, MetaCommands } from "@dicekeys/dicekeys-api-js/dist/api-strings";
import {
  GenerateSignature,
  GetPassword,
  GetSealingKey,
  GetSecret,
  GetSignatureVerificationKey,
  GetSigningKey,
  GetSymmetricKey,
  GetUnsealingKey,
  SealWithSymmetricKey,
  UnsealWithSymmetricKey,
  UnsealWithUnsealingKey,
} from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {
  SignatureVerificationKeyJson,
  SignatureVerificationKeyFields,
  SealingKeyJson,
  SealingKeyFields,
  SecretFields,
  SecretJson,
  SigningKeyJson,
  SigningKeyFields,
  SymmetricKeyJson,
  SymmetricKeyFields,
  UnsealingKeyJson,
  UnsealingKeyFields,
  PackagedSealedMessageJson,
  PackagedSealedMessageFields
} from "@dicekeys/seeded-crypto-js";
import {
  getRequestsDerivationOptionsJson
} from "../api-handler/get-requests-derivation-options-json";
const {
  Inputs,
  Outputs
} = ApiStrings;

export class UrlApi {
  private pendingCallResolveFunctions = new Map<string, {resolve: (url: URL) => any, reject: (err: any) => any}>();

  constructor(
    private requestUrlBase: string,
    private respondToUrl: string,
    private transmitRequest: (request: URL) => any
  ) {
///    super();
  }

  private authToken?: string;
  protected getAuthToken = async (forceReload: boolean = false): Promise<string> => {
    if (forceReload || !this.authToken) {
      const requestUrl = new URL(this.requestUrlBase);
      const requestId = ApiFactory.generateRequestId();
      const urlPromise = new Promise<URL>( (resolve, reject) => this.pendingCallResolveFunctions.set(requestId, {resolve, reject}));
      requestUrl.searchParams.append(Inputs.COMMON.requestId, requestId);
      requestUrl.searchParams.append(Inputs.COMMON.respondTo, this.respondToUrl);
      requestUrl.searchParams.append(Inputs.COMMON.command, MetaCommands.getAuthToken);
      this.transmitRequest(requestUrl);
      const url = await urlPromise;
      const newAuthToken = url.searchParams.get(Outputs.getAuthToken.authToken);
      if (newAuthToken != null) {
        this.authToken = newAuthToken;        
      } else {
        throw new Exceptions.ClientNotAuthorizedException();
      }
    }
    return this.authToken!;
  }

//  protected call: ApiFactory.ApiClientImplementation = async <COMMAND extends ApiStrings.Command>(
  protected call = async <
    REQUEST extends ApiCalls.ApiRequestObject>(
    request: REQUEST & ApiCalls.ApiRequestObject
  ): Promise<ApiCalls.ResultForRequest<REQUEST>> => {
    const requestUrl = new URL(this.requestUrlBase);
    const marshallString = (field: string, value: string) => requestUrl.searchParams.set(field, value);
    const requestId = ApiFactory.generateRequestId();
    marshallString(Inputs.COMMON.requestId, requestId);
    marshallString(Inputs.COMMON.respondTo, this.respondToUrl);
    marshallString(Inputs.COMMON.command, request.command)
    const derivationOptionsJson = getRequestsDerivationOptionsJson(request);
    if ("derivationOptionsJson" in request) {
      marshallString(Inputs.withDerivationOptions.derivationOptionsJson, request.derivationOptionsJson)
    }
    const {requireAuthenticationHandshake} = DerivationOptions(derivationOptionsJson);
    if (requireAuthenticationHandshake) {
      const authToken = await this.getAuthToken();
      requestUrl.searchParams.set(Inputs.COMMON.authToken, authToken);
    }
    switch(request.command) {
      case Commands.generateSignature:
        marshallString(Inputs.generateSignature.message, urlSafeBase64Encode(request.message));
        break;
      case Commands.getPassword:
      case Commands.getSealingKey:
      case Commands.getSecret:
      case Commands.getSignatureVerificationKey:
      case Commands.getSigningKey:
      case Commands.getSymmetricKey:
      case Commands.getUnsealingKey:
        break;
      case Commands.sealWithSymmetricKey:
        marshallString(Inputs.sealWithSymmetricKey.plaintext, urlSafeBase64Encode(request.plaintext));
        if (request.unsealingInstructions != null) {
          marshallString(Inputs.sealWithSymmetricKey.unsealingInstructions, request.unsealingInstructions);
        }
        break;
      case Commands.unsealWithSymmetricKey:
      case Commands.unsealWithUnsealingKey:
        const {ciphertext, derivationOptionsJson, unsealingInstructions} = request.packagedSealedMessage;
        marshallString(Inputs.unsealWithUnsealingKey.packagedSealedMessage, JSON.stringify({
          ciphertext: urlSafeBase64Encode(ciphertext),
          derivationOptionsJson, unsealingInstructions
        }));
    }
    const urlPromise = new Promise<URL>( (resolve, reject) => this.pendingCallResolveFunctions.set(requestId, {resolve, reject}));
    this.transmitRequest(requestUrl);
    const url = await urlPromise;
    const fromJson = <T, U>(json: string, f: (t: T) => U) => f(JSON.parse(json) as T);
    const required = (parameterName: string): string => url.searchParams.get(parameterName) ??
      ( () => { throw new Exceptions.MissingResponseParameter(parameterName) ; })()

    switch(request.command) {
      case Commands.generateSignature:
        return {
          signature: urlSafeBase64Decode(required(Outputs.generateSignature.signature)),
          signatureVerificationKey: fromJson<SignatureVerificationKeyJson, SignatureVerificationKeyFields>(
            required(Outputs.generateSignature.signatureVerificationKey), 
            ({signatureVerificationKeyBytes, derivationOptionsJson}) => ({
              derivationOptionsJson,
              signatureVerificationKeyBytes: urlSafeBase64Decode(signatureVerificationKeyBytes)
            }))
        } as ApiCalls.ApiCallResult<GenerateSignature>
      case Commands.getPassword:
        return {
          password: required(Outputs.getPassword.password),
          derivationOptionsJson: required(Outputs.getPassword.derivationOptionsJson)
        } as ApiCalls.ApiCallResult<GetPassword>
      case Commands.getSealingKey:
        return fromJson<SealingKeyJson, SealingKeyFields>( required(Outputs.getSealingKey.sealingKey),
          ({sealingKeyBytes, derivationOptionsJson}) => ({
            sealingKeyBytes: urlSafeBase64Decode(sealingKeyBytes),
            derivationOptionsJson
          })) as ApiCalls.ApiCallResult<GetSealingKey>;
      case Commands.getSecret:
        return fromJson<SecretJson, SecretFields>( required(Outputs.getSecret.secret),
          ({secretBytes, derivationOptionsJson}) => ({
            secretBytes: urlSafeBase64Decode(secretBytes),
            derivationOptionsJson
          })) as ApiCalls.ApiCallResult<GetSecret>;
      case Commands.getSignatureVerificationKey:
        return fromJson<SignatureVerificationKeyJson, SignatureVerificationKeyFields>(
          required(Outputs.getSignatureVerificationKey.signatureVerificationKey),
          ({signatureVerificationKeyBytes, derivationOptionsJson}) => ({
            signatureVerificationKeyBytes: urlSafeBase64Decode(signatureVerificationKeyBytes),
            derivationOptionsJson
          })) as ApiCalls.ApiCallResult<GetSignatureVerificationKey>;
      case Commands.getSigningKey:
        return fromJson<SigningKeyJson, SigningKeyFields>(
          required(Outputs.getSigningKey.signingKey),
          ({signingKeyBytes, signatureVerificationKeyBytes, derivationOptionsJson}) => ({
            derivationOptionsJson,
            signingKeyBytes: urlSafeBase64Decode(signingKeyBytes),
            signatureVerificationKeyBytes: signatureVerificationKeyBytes == null ?
              new Uint8Array() :
              urlSafeBase64Decode(signatureVerificationKeyBytes)
          })) as ApiCalls.ApiCallResult<GetSigningKey>;
      case Commands.getSymmetricKey:
        return fromJson<SymmetricKeyJson, SymmetricKeyFields>(
          required(Outputs.getSymmetricKey.symmetricKey),
          ({keyBytes, derivationOptionsJson}) => ({
            keyBytes: urlSafeBase64Decode(keyBytes),
            derivationOptionsJson
          })) as ApiCalls.ApiCallResult<GetSymmetricKey>;
      case Commands.getUnsealingKey:
        return fromJson<UnsealingKeyJson, UnsealingKeyFields>(
          required(Outputs.getUnsealingKey.unsealingKey),
          ({unsealingKeyBytes, sealingKeyBytes, derivationOptionsJson}) => ({
            unsealingKeyBytes: urlSafeBase64Decode(unsealingKeyBytes),
            sealingKeyBytes: urlSafeBase64Decode(sealingKeyBytes),
            derivationOptionsJson
          })) as ApiCalls.ApiCallResult<GetUnsealingKey>;
        break;
      case Commands.sealWithSymmetricKey:
        return fromJson<PackagedSealedMessageJson, PackagedSealedMessageFields>(
          required(Outputs.sealWithSymmetricKey.packagedSealedMessage),
          ({ciphertext, unsealingInstructions, derivationOptionsJson}) => ({
            ciphertext: urlSafeBase64Decode(ciphertext),
            unsealingInstructions,
            derivationOptionsJson
          })) as ApiCalls.ApiCallResult<SealWithSymmetricKey>;
      case Commands.unsealWithSymmetricKey:
        return {plaintext: urlSafeBase64Decode(required(Outputs.unsealWithSymmetricKey.plaintext))} as ApiCalls.ApiCallResult<UnsealWithSymmetricKey>;
      case Commands.unsealWithUnsealingKey:
        return {plaintext: urlSafeBase64Decode(required(Outputs.unsealWithUnsealingKey.plaintext))} as ApiCalls.ApiCallResult<UnsealWithUnsealingKey>;
      default:
        throw new Error();
      }
    throw new Error();
  }

  readonly generateSignature = ApiFactory.apiCallFactory("generateSignature", this.call);
  readonly getPassword = ApiFactory.apiCallFactory("getPassword", this.call);
  readonly getSealingKey = ApiFactory.apiCallFactory("getSealingKey", this.call);
  readonly getSecret = ApiFactory.apiCallFactory("getSecret", this.call);
  readonly getSignatureVerificationKey = ApiFactory.apiCallFactory("getSignatureVerificationKey", this.call);
  readonly getSigningKey = ApiFactory.apiCallFactory("getSigningKey", this.call);
  readonly getSymmetricKey = ApiFactory.apiCallFactory("getSymmetricKey", this.call);
  readonly getUnsealingKey = ApiFactory.apiCallFactory("getUnsealingKey", this.call);
  readonly sealWithSymmetricKey = ApiFactory.apiCallFactory("sealWithSymmetricKey", this.call);
  readonly unsealWithSymmetricKey = ApiFactory.apiCallFactory("unsealWithSymmetricKey", this.call);
  readonly unsealWithUnsealingKey = ApiFactory.apiCallFactory("unsealWithUnsealingKey", this.call);
  
  /**
   * Activities and Fragments that use this API should implement onActivityResult and
   * and call handleOnActivityResult with the data/intent (third parameter) received.
   * Doing so allows this class to process results returned to the activity/fragment
   * and then call the appropriate callback functions when an API call has either
   * succeeded or failed.
   */
  handleResult = (result: URL) => {
    const requestId = result.searchParams.get(Outputs.COMMON.requestId);
    if (requestId && this.pendingCallResolveFunctions.has(requestId)) {
      const resolveFn = this.pendingCallResolveFunctions.get(requestId);
      this.pendingCallResolveFunctions.delete(requestId);
      try {
        const exception = result.searchParams.get(Outputs.COMMON.exception);
        if (exception) {
          const message = result.searchParams.get(Outputs.COMMON.message) ?? undefined;
          const stack = result.searchParams.get(Outputs.COMMON.stack) ?? undefined;
          throw Exceptions.restoreException(exception, message, stack);
          // throw new Error(`Exception: ${exception} with message ${message}`);
        }
        resolveFn!.resolve(result);
      } catch (e) {
        resolveFn!.reject(e);
      }
    }
  }

}
