import {
  ApiCalls,
  Exceptions,
  UrlRequestMetadataParameterNames,
  urlSafeBase64Decode, urlSafeBase64Encode,
  UrlApiMetaCommand
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfUrlNotPermitted
} from "./url-permission-checks";
import {
  handleApiRequest,
  ApiRequestContext,
  ConsentResponse
} from "./handle-api-request";
import {
  GenerateSignatureParameterNames,
  GenerateSignatureRequest,
  GenerateSignatureSuccessResponseParameterNames,
  GetPasswordRequest,
  GetPasswordSuccessResponseParameterNames,
  GetSealingKeyRequest,
  GetSecretRequest,
  GetSignatureVerificationKeyRequest,
  GetSigningKeyRequest,
  GetSymmetricKeyRequest,
  GetUnsealingKeyRequest,
  ResponseMetadataParameterNames,
  SealWithSymmetricKeyParameterNames,
  SealWithSymmetricKeyRequest,
  UnsealSuccessResponseParameterNames,
  UnsealWithSymmetricKeyRequest,
  UnsealParameterNames,
  UnsealWithUnsealingKeyRequest,
} from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {
  EncryptedCrossTabState
} from "../state";

interface MarshallCommand<COMMAND extends ApiCalls.Command> {
  (
    marhsallers: {
      add: (fieldName: string, value: string) => void
    },
    response: ApiCalls.ResponseForCommand<COMMAND>,
  ): void
}

// Since TypeScript doesn't do type inference on switch statements well enough,
// this function allows us to simulate a properly typed switch case statement.
const commandMarshallers = new Map<ApiCalls.Command, MarshallCommand<ApiCalls.Command>>();
const addResponseMarshallerForCommand = <COMMAND extends ApiCalls.Command>(
  forCommand: COMMAND | COMMAND[],
  callback: MarshallCommand<COMMAND>
): void => {
  for (const command of Array.isArray(forCommand) ? forCommand : [forCommand]) {
    commandMarshallers.set(command, callback);
  }
}
addResponseMarshallerForCommand(
  ApiCalls.Command.generateSignature,
  ({add}, {signature, seededCryptoObjectAsJson}) => {
    add(GenerateSignatureSuccessResponseParameterNames.signature, urlSafeBase64Encode(signature));
    add(GenerateSignatureSuccessResponseParameterNames.seededCryptoObjectAsJson, seededCryptoObjectAsJson);
});
addResponseMarshallerForCommand(
  [
    ApiCalls.Command.getPassword,
    ApiCalls.Command.getSealingKey,
    ApiCalls.Command.getSecret,
    ApiCalls.Command.getSignatureVerificationKey,
    ApiCalls.Command.getSigningKey,
    ApiCalls.Command.getSymmetricKey,
    ApiCalls.Command.getUnsealingKey,
    ApiCalls.Command.sealWithSymmetricKey,
  ],
  ({add}, {seededCryptoObjectAsJson}) => {
    add(GetPasswordSuccessResponseParameterNames.seededCryptoObjectAsJson, seededCryptoObjectAsJson);
});
addResponseMarshallerForCommand(
  [
    ApiCalls.Command.unsealWithSymmetricKey,
    ApiCalls.Command.unsealWithUnsealingKey,
  ],
  ({add}, {plaintext}) => {
    add(UnsealSuccessResponseParameterNames.plaintext, urlSafeBase64Encode(plaintext) );
});

export const addResponseToUrl = (
  command: ApiCalls.Command,
  responseUrl: string,
  response: ApiCalls.Response,
): string => {
  // Construct a response URL onto which we can add response parameters
  const url = new URL(responseUrl);
  // Syntactic sugar for marshalling responses into the URL
  const add = (name: string, value: string) => url.searchParams.set(name, value);
  // Always copy the requestId back into the response
  add(ResponseMetadataParameterNames.requestId, response.requestId);

  // Marshall exceptions if thrown.
  if ("exception" in response) {
    const {exception, message, stack} = response;
    add(ApiCalls.ExceptionResponseParameterNames.exception, exception);
    if (message != null) {
      add(ApiCalls.ExceptionResponseParameterNames.message!, message);
    }
    if (stack != null) {
      add(ApiCalls.ExceptionResponseParameterNames.stack!, stack);
    }
    return url.toString();
  }

  // Get the correct marshaller for this command and call it.
  const marshaller = commandMarshallers.get(command);
  marshaller?.({add}, response);

  return url.toString();
}

export const getApiRequestFromSearchParams = (
  searchParams: URLSearchParams
): ApiCalls.ApiRequestObject | undefined => {
  const command = searchParams.get(ApiCalls.RequestCommandParameterNames.command) ?? undefined;
  if (command == null) {
    return undefined;
  }
  if (!(command in ApiCalls.Command)) {
    throw new Exceptions.InvalidCommand(`Invalid API command: ${command}`);
  }
  const requireParam = (paramName: string) => searchParams.get(paramName) ??
    (() => { throw new Exceptions.MissingParameter(`Command ${command} missing parameter ${paramName}.`);} )();
  
  switch (command) {
    case ApiCalls.Command.generateSignature:
      return {
        command,
        derivationOptionsJson: requireParam(ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson),
        message: urlSafeBase64Decode(requireParam(GenerateSignatureParameterNames.message))
      } as GenerateSignatureRequest;
    case ApiCalls.Command.getPassword:
    case ApiCalls.Command.getSealingKey:
    case ApiCalls.Command.getSecret:
    case ApiCalls.Command.getSignatureVerificationKey:
    case ApiCalls.Command.getSigningKey:
    case ApiCalls.Command.getSymmetricKey:
    case ApiCalls.Command.getUnsealingKey:
      return {
        command,
        [ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson]: requireParam(ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson),
      } as GetPasswordRequest | GetSealingKeyRequest | GetSecretRequest | GetSignatureVerificationKeyRequest | GetSigningKeyRequest | GetSymmetricKeyRequest | GetUnsealingKeyRequest;
    case ApiCalls.Command.sealWithSymmetricKey: {
      const unsealingInstructions = searchParams.get(SealWithSymmetricKeyParameterNames.unsealingInstructions) ?? undefined;
      return {
        command,
        [SealWithSymmetricKeyParameterNames.derivationOptionsJson]: requireParam(SealWithSymmetricKeyParameterNames.derivationOptionsJson),
        [SealWithSymmetricKeyParameterNames.plaintext]: urlSafeBase64Decode(requireParam(SealWithSymmetricKeyParameterNames.plaintext)),
        ...( unsealingInstructions == null ? {} :{unsealingInstructions}
        )
      } as SealWithSymmetricKeyRequest;
    }
    case ApiCalls.Command.unsealWithSymmetricKey:
    case ApiCalls.Command.unsealWithUnsealingKey: {
      const packagedSealedMessageJson = requireParam(UnsealParameterNames.packagedSealedMessageJson);
      return {
        command,
        packagedSealedMessageJson
      } as UnsealWithSymmetricKeyRequest | UnsealWithUnsealingKeyRequest;
    }
  }
  throw new Exceptions.InvalidCommand(command);
}

const getApiRequestContextFromUrl = (
  requestUrl: URL
): undefined | (ApiRequestContext & {hostValidatedViaAuthToken: boolean, respondTo: string, origin: string, pathname: string}) => {
  const {searchParams} = requestUrl;
  var respondTo = searchParams.get(UrlRequestMetadataParameterNames.respondTo);
  var hostValidatedViaAuthToken = false;
  const requestId = searchParams.get(ApiCalls.RequestMetadataParameterNames.requestId);
  const authToken = searchParams.get(UrlRequestMetadataParameterNames.authToken!) ?? undefined;
  if (authToken != null ) {
    const authUrl = EncryptedCrossTabState.instance?.getUrlForAuthenticationToken(authToken);
    if (authUrl != null) {
      respondTo = authUrl;
      hostValidatedViaAuthToken = true;
    }
  }
  if (typeof requestId !== "string" || typeof respondTo !== "string") {
    // This is not a request.  Ignore this message event.
    return;
  }
  const request = getApiRequestFromSearchParams(requestUrl.searchParams);
  if (request == null) {
    return undefined;
  }
  const {origin, host, pathname} = new URL(respondTo);
  return {
    request: {...request, requestId},
    host,
    hostValidatedViaAuthToken,
    respondTo,
    origin,
    pathname
  }
}

/**
 * 
 * @param getUsersConsent 
 * @param transmitResponseUrl Set only when testing.  By default, opens a window to to response URL
 */
export const urlApiResponder = (
  getUsersConsent: (requestContext: ApiRequestContext) => Promise<ConsentResponse>,
  transmitResponseUrl: (response: string) => any = (url: string) => window.location.replace(url)
) => (candidateRequestUrl: string) => {
  const requestUrl = new URL(candidateRequestUrl);
  if (requestUrl.searchParams.get(ApiCalls.RequestCommandParameterNames.command) === UrlApiMetaCommand.getAuthToken) {
    // Special case request for authentication tokens.
    const respondTo = requestUrl.searchParams.get(UrlRequestMetadataParameterNames.respondTo);
    const requestId = requestUrl.searchParams.get(ApiCalls.RequestMetadataParameterNames.requestId);
    if (typeof respondTo === "string" && typeof requestId === "string") {
      const responseUrl = new URL(respondTo);
      const authToken = EncryptedCrossTabState.instance?.addAuthenticationToken(respondTo);
      responseUrl.searchParams.set(ResponseMetadataParameterNames.requestId, requestId);
      if (authToken) {
        responseUrl.searchParams.set(UrlRequestMetadataParameterNames.authToken!, authToken);
      }
      transmitResponseUrl(responseUrl.toString());
    }
    return;
  }
  const processedRequest = getApiRequestContextFromUrl(requestUrl);
  if (processedRequest == null) {
    return;
  }
  const {pathname, respondTo, hostValidatedViaAuthToken, ...requestContext} = processedRequest;
  const {host} = requestContext;

  const transmitResponse = (response: ApiCalls.Response) => {
    const marshalledResponseUrl = addResponseToUrl( requestContext.request.command, respondTo, response);
    transmitResponseUrl(marshalledResponseUrl.toString())
  };
  const throwIfClientNotPermitted = throwIfUrlNotPermitted(host, pathname, hostValidatedViaAuthToken);
  return handleApiRequest(
    throwIfClientNotPermitted,
    getUsersConsent,
    transmitResponse,
    requestContext
  )
}
