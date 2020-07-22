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
  GetSecretResponse,
} from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {
  SignatureVerificationKeyJson,
  SealingKeyJson,
  SecretJson,
  SigningKeyJson,
  SymmetricKeyJson,
  UnsealingKeyJson,
  PackagedSealedMessageJson,
} from "@dicekeys/seeded-crypto-js";
import {
  getRequestsDerivationOptionsJson
} from "../api-handler/get-requests-derivation-options-json";
const {
  Inputs,
  Outputs
} = ApiStrings;

export class UrlApi {
  private pendingPromisesForRequestResponseUrls = new Map<string, (url: URL) => any>();

  constructor(
    private requestUrlString: string,
    private respondToUrl: string,
    private transmitRequest: (request: URL) => any
  ) {

  }

  private authToken?: string;
  protected getAuthToken = async (forceReload: boolean = false): Promise<string> => {
    if (forceReload || !this.authToken) {
      const requestUrl = new URL(this.requestUrlString);
      const requestId = ApiFactory.generateRequestId();
      requestUrl.searchParams.set(Inputs.COMMON.requestId, requestId);
      requestUrl.searchParams.set(Inputs.COMMON.respondTo, this.respondToUrl);
      requestUrl.searchParams.set(Inputs.COMMON.command, MetaCommands.getAuthToken);
      return new Promise<string>( (resolve, reject) => {
        this.pendingPromisesForRequestResponseUrls.set(requestId, url => {
          const newAuthToken = url.searchParams.get(Outputs.getAuthToken.authToken);
          if (newAuthToken != null) {
            this.authToken = newAuthToken;
            resolve(newAuthToken);        
          } else {
            reject(new Exceptions.ClientNotAuthorizedException());
          }
        });
        this.transmitRequest(requestUrl);
      })
    } else {
       return this.authToken;
    }
  }

//  protected call: ApiFactory.ApiClientImplementation = async <COMMAND extends ApiStrings.Command>(
  protected call = async <
    REQUEST extends ApiCalls.ApiRequestObject>(
    request: REQUEST & ApiCalls.ApiRequestObject
  ): Promise<ApiCalls.ResultForRequest<REQUEST>> => {
    const requestUrl = new URL(this.requestUrlString);
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
        const {ciphertext, derivationOptionsJson, unsealingInstructions} = request.packagedSealedMessageFields;
        marshallString(Inputs.unsealWithUnsealingKey.packagedSealedMessageFields, JSON.stringify({
          ciphertext: urlSafeBase64Encode(ciphertext),
          derivationOptionsJson, unsealingInstructions
        }));
    }
    const urlPromise = new Promise<URL>( (resolve, _reject) => this.pendingPromisesForRequestResponseUrls.set(requestId, resolve));
    this.transmitRequest(requestUrl);
    const url = await urlPromise;
    const exception = url.searchParams.get(Outputs.COMMON.exception);
    if (typeof exception === "string") {
      const message = url.searchParams.get(Outputs.COMMON.message) ?? undefined;
      const stack = url.searchParams.get(Outputs.COMMON.stack) ?? undefined;
      throw Exceptions.restoreException(exception, message, stack);
    }

    const fromJson = <T, U>(json: string, f: (t: T) => U) => f(JSON.parse(json) as T);
    const required = (parameterName: string): string => url.searchParams.get(parameterName) ??
      ( () => { throw new Exceptions.MissingResponseParameter(parameterName) ; })()


    switch(request.command) {
      case Commands.generateSignature:
        return fromJson<SignatureVerificationKeyJson, ApiCalls.ApiCallResult<GenerateSignature>>(
          required(Outputs.generateSignature.signatureVerificationKeyFields), 
          ({signatureVerificationKeyBytes, derivationOptionsJson}) => ({
            [Outputs.generateSignature.signatureVerificationKeyFields]: {
              derivationOptionsJson,
              signatureVerificationKeyBytes: urlSafeBase64Decode(signatureVerificationKeyBytes)
            },
            [Outputs.generateSignature.signature]: urlSafeBase64Decode(required(Outputs.generateSignature.signature))            
          } )
        ) as ApiCalls.ApiCallResult<GenerateSignature>
      case Commands.getPassword:
        return {
          password: required(Outputs.getPassword.password),
          derivationOptionsJson: required(Outputs.getPassword.derivationOptionsJson)
        } as ApiCalls.ApiCallResult<GetPassword>
      case Commands.getSealingKey:
        return fromJson<SealingKeyJson, ApiCalls.ApiCallResult<GetSealingKey>>( required(Outputs.getSealingKey.sealingKeyFields),
          ({sealingKeyBytes, derivationOptionsJson}) => ({
            [Outputs.getSealingKey.sealingKeyFields]: {
              sealingKeyBytes: urlSafeBase64Decode(sealingKeyBytes),
              derivationOptionsJson
            }
          })) as ApiCalls.ApiCallResult<GetSealingKey>;
      case Commands.getSecret:
        return fromJson<SecretJson, GetSecretResponse>( required(Outputs.getSecret.secretFields),
          ({secretBytes, derivationOptionsJson}) => ({
            [Outputs.getSecret.secretFields]: {
              secretBytes: urlSafeBase64Decode(secretBytes),
              derivationOptionsJson
            }
          })) as ApiCalls.ApiCallResult<GetSecret>;
      case Commands.getSignatureVerificationKey:
        return fromJson<SignatureVerificationKeyJson, ApiCalls.ApiCallResult<GetSignatureVerificationKey>>(
          required(Outputs.getSignatureVerificationKey.signatureVerificationKeyFields),
          ({signatureVerificationKeyBytes, derivationOptionsJson}) => ({
            [Outputs.getSignatureVerificationKey.signatureVerificationKeyFields]: {
              signatureVerificationKeyBytes: urlSafeBase64Decode(signatureVerificationKeyBytes),
              derivationOptionsJson
            }
          })) as ApiCalls.ApiCallResult<GetSignatureVerificationKey>;
      case Commands.getSigningKey:
        return fromJson<SigningKeyJson, ApiCalls.ApiCallResult<GetSigningKey>>(
          required(Outputs.getSigningKey.signingKeyFields),
          ({signingKeyBytes, signatureVerificationKeyBytes, derivationOptionsJson}) => ({
            [Outputs.getSigningKey.signingKeyFields]: {
              derivationOptionsJson,
              signingKeyBytes: urlSafeBase64Decode(signingKeyBytes),
              signatureVerificationKeyBytes: signatureVerificationKeyBytes == null ?
                new Uint8Array() :
                urlSafeBase64Decode(signatureVerificationKeyBytes)
            }
          })) as ApiCalls.ApiCallResult<GetSigningKey>;
      case Commands.getSymmetricKey:
        return fromJson<SymmetricKeyJson, ApiCalls.ApiCallResult<GetSymmetricKey>>(
          required(Outputs.getSymmetricKey.symmetricKeyFields),
          ({keyBytes, derivationOptionsJson}) => ({
            [Outputs.getSymmetricKey.symmetricKeyFields]: {
              keyBytes: urlSafeBase64Decode(keyBytes),
              derivationOptionsJson
            }
          })) as ApiCalls.ApiCallResult<GetSymmetricKey>;
      case Commands.getUnsealingKey:
        return fromJson<UnsealingKeyJson, ApiCalls.ApiCallResult<GetUnsealingKey>>(
          required(Outputs.getUnsealingKey.unsealingKeyFields),
          ({unsealingKeyBytes, sealingKeyBytes, derivationOptionsJson}) => ({
            [Outputs.getUnsealingKey.unsealingKeyFields]: {
              unsealingKeyBytes: urlSafeBase64Decode(unsealingKeyBytes),
              sealingKeyBytes: urlSafeBase64Decode(sealingKeyBytes),
              derivationOptionsJson
            }
          })) as ApiCalls.ApiCallResult<GetUnsealingKey>;
        break;
      case Commands.sealWithSymmetricKey:
        return fromJson<PackagedSealedMessageJson, ApiCalls.ApiCallResult<SealWithSymmetricKey>>(
          required(Outputs.sealWithSymmetricKey.packagedSealedMessageFields),
          ({ciphertext, unsealingInstructions, derivationOptionsJson}) => ({
            [Outputs.sealWithSymmetricKey.packagedSealedMessageFields]: {
              ciphertext: urlSafeBase64Decode(ciphertext),
              unsealingInstructions,
              derivationOptionsJson
            }
          })) as ApiCalls.ApiCallResult<SealWithSymmetricKey>;
      case Commands.unsealWithSymmetricKey:
        return {plaintext: urlSafeBase64Decode(required(Outputs.unsealWithSymmetricKey.plaintext))} as ApiCalls.ApiCallResult<UnsealWithSymmetricKey>;
      case Commands.unsealWithUnsealingKey:
        return {plaintext: urlSafeBase64Decode(required(Outputs.unsealWithUnsealingKey.plaintext))} as ApiCalls.ApiCallResult<UnsealWithUnsealingKey>;
      default:
        throw new Error();
      }
  }

  readonly generateSignature = ApiFactory.apiCallFactory<GenerateSignature>("generateSignature", this.call);
  readonly getSealingKey = ApiFactory.apiCallFactory<GetSealingKey>("getSealingKey", this.call);
  readonly getSecret = ApiFactory.apiCallFactory<GetSecret>("getSecret", this.call);
  readonly getPassword = ApiFactory.apiCallFactory<GetPassword>("getPassword", this.call);
  readonly getSignatureVerificationKey = ApiFactory.apiCallFactory<GetSignatureVerificationKey>("getSignatureVerificationKey", this.call);
  readonly getSigningKey = ApiFactory.apiCallFactory<GetSigningKey>("getSigningKey", this.call);
  readonly getSymmetricKey = ApiFactory.apiCallFactory<GetSymmetricKey>("getSymmetricKey", this.call);
  readonly getUnsealingKey = ApiFactory.apiCallFactory<GetUnsealingKey>("getUnsealingKey", this.call);
  readonly sealWithSymmetricKey = ApiFactory.apiCallFactory<SealWithSymmetricKey>("sealWithSymmetricKey", this.call);
  readonly unsealWithSymmetricKey = ApiFactory.apiCallFactory<UnsealWithSymmetricKey>("unsealWithSymmetricKey", this.call);
  readonly unsealWithUnsealingKey = ApiFactory.apiCallFactory<UnsealWithUnsealingKey>("unsealWithUnsealingKey", this.call);
  
  /**
   * Activities and Fragments that use this API should implement onActivityResult and
   * and call handleOnActivityResult with the data/intent (third parameter) received.
   * Doing so allows this class to process results returned to the activity/fragment
   * and then call the appropriate callback functions when an API call has either
   * succeeded or failed.
   */
  handleResult = (result: URL) => {
    const requestId = result.searchParams.get(Outputs.COMMON.requestId);
    if (requestId && this.pendingPromisesForRequestResponseUrls.has(requestId)) {
      const resolve = this.pendingPromisesForRequestResponseUrls.get(requestId)!;
      this.pendingPromisesForRequestResponseUrls.delete(requestId);
      resolve(result);
    }
  }

}
