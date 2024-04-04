import {
  ApiCalls,
  Exceptions,
  GetAuthTokenRequest,
  UrlApiMetaCommand,
  UrlRequestMetadataParameterNames,
  urlSafeBase64Decode, urlSafeBase64Encode
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfUrlNotPermitted
} from "./url-permission-checks";
import {
  QueuedApiRequest
} from "./QueuedApiRequest";
import {
  GenerateSignatureParameterNames,
  GenerateSignatureRequest,
  GenerateSignatureSuccessResponseParameterNames,
  GetPasswordRequest,
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
  SeededCryptoObjectResponseParameterNames
} from "@dicekeys/dicekeys-api-js/dist/api-calls";
import { addAuthenticationToken, getUrlForAuthenticationToken } from "../state/stores/AuthenticationTokens";
import {RUNNING_IN_ELECTRON} from "../utilities/is-electron";
import type {ElectronBridgeRendererView} from "../../../common/IElectronBridge";
import { KnownCustomProtocolsToTheirAssociatedDomains } from "./KnownCustomProtocols";
import { FaceLetterAndDigit } from "../dicekeys/DiceKey";


const getApiRequestFromSearchParams = (
  searchParams: URLSearchParams
): ApiCalls.ApiRequestObject | GetAuthTokenRequest | undefined => {
  const command = searchParams.get(ApiCalls.RequestCommandParameterNames.command) ?? undefined;
  if (command == null) {
    return undefined;
  }
  if (!(command in ApiCalls.Command) && command !== UrlApiMetaCommand.getAuthToken) {
    throw new Exceptions.InvalidCommand(`Invalid API command: ${command}`);
  }
  const requireParam = (paramName: string) => searchParams.get(paramName) ??
    (() => { throw new Exceptions.MissingParameter(`Command ${command} missing parameter ${paramName}.`);} )();
  
  switch (command) {
    case UrlApiMetaCommand.getAuthToken:
      return {
        command
      } as GetAuthTokenRequest
    case ApiCalls.Command.generateSignature:
      return {
        command,
        [ApiCalls.RecipeFunctionParameterNames.recipe]:
          searchParams.get(ApiCalls.RecipeFunctionParameterNames.recipe) ?? "",
        [ApiCalls.RecipeFunctionParameterNames.recipeMayBeModified]:
          searchParams.get(ApiCalls.RecipeFunctionParameterNames.recipeMayBeModified)?.toLocaleLowerCase() === "true",
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
        [ApiCalls.RecipeFunctionParameterNames.recipe]:
          searchParams.get(ApiCalls.RecipeFunctionParameterNames.recipe) ?? "",
        [ApiCalls.RecipeFunctionParameterNames.recipeMayBeModified]:
          searchParams.get(ApiCalls.RecipeFunctionParameterNames.recipeMayBeModified)?.toLocaleLowerCase() === "true",
      } as GetPasswordRequest | GetSealingKeyRequest | GetSecretRequest | GetSignatureVerificationKeyRequest | GetSigningKeyRequest | GetSymmetricKeyRequest | GetUnsealingKeyRequest;
    case ApiCalls.Command.sealWithSymmetricKey: {
      const unsealingInstructions = searchParams.get(SealWithSymmetricKeyParameterNames.unsealingInstructions) ?? undefined;
      return {
        command,
        [ApiCalls.RecipeFunctionParameterNames.recipe]:
          searchParams.get(ApiCalls.RecipeFunctionParameterNames.recipe) ?? "",
        [ApiCalls.RecipeFunctionParameterNames.recipeMayBeModified]:
          searchParams.get(ApiCalls.RecipeFunctionParameterNames.recipeMayBeModified)?.toLocaleLowerCase() === "true",
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

const decodeRequestFromUrlIfPresent = (
  requestUrl: URL
) => {
  const {searchParams} = requestUrl;
  const respondTo = searchParams.get(UrlRequestMetadataParameterNames.respondTo);
  let hostValidatedViaAuthToken = false;
  const requestId = searchParams.get(ApiCalls.RequestMetadataParameterNames.requestId);
  const authToken = searchParams.get(UrlRequestMetadataParameterNames.authToken) ?? undefined;
  if (authToken != null ) {
    const authUrl = getUrlForAuthenticationToken(authToken);
    if (authUrl === respondTo) {
      hostValidatedViaAuthToken = true;
    }
  }
  // console.log(`decodeRequestFromUrlIfPresent`, requestId, respondTo)
  if (typeof requestId !== "string" || typeof respondTo !== "string") {
    // This is not a request.  Ignore this message event.
    return undefined;
  }
  const request = getApiRequestFromSearchParams(requestUrl.searchParams);
  if (request == null) {
    return undefined;
  }
  const {origin, protocol, host, pathname} = new URL(respondTo);
  return {
    originalRequest: {...request, requestId},
    protocol,
    host,
    hostValidatedViaAuthToken,
    respondTo,
    origin,
    pathname
  }
};

type GetAuthTokenCommand = typeof UrlApiMetaCommand.getAuthToken
type CommandsAndMetaCommands = ApiCalls.Command | GetAuthTokenCommand;

interface ResponseForGetAuthToken {
  command: typeof UrlApiMetaCommand.getAuthToken;
  authToken: string;
}

interface MarshallCommand<COMMAND extends CommandsAndMetaCommands> {
  (
    command: COMMAND,
    marshaller: {
      add: (fieldName: string, value: string) => void
    },
    response: COMMAND extends GetAuthTokenCommand ? ResponseForGetAuthToken : ApiCalls.ResponseForCommand<Exclude<COMMAND, GetAuthTokenCommand>>,
  ): void
}

// Since TypeScript doesn't do type inference on switch statements well enough,
// this function allows us to simulate a properly typed switch case statement.
const commandMarshallers = new Map<CommandsAndMetaCommands, MarshallCommand<ApiCalls.Command>>();
const addResponseMarshallerForCommand = <COMMANDS extends CommandsAndMetaCommands[]>(
  forCommand: COMMANDS,
  callback: MarshallCommand<COMMANDS[number]>
): void => {
  for (const command of forCommand) {
    commandMarshallers.set(command, callback);
  }
}
addResponseMarshallerForCommand(
  [
    UrlApiMetaCommand.getAuthToken
  ],
  (_, {add}, {authToken}) => {
    add("authToken", authToken);
});
addResponseMarshallerForCommand(
  [
    ApiCalls.Command.generateSignature
  ],
  (_, {add}, {signature, signatureVerificationKeyJson}) => {
    add(GenerateSignatureSuccessResponseParameterNames.signature, urlSafeBase64Encode(signature));
    add(GenerateSignatureSuccessResponseParameterNames.signatureVerificationKeyJson, signatureVerificationKeyJson);
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
  (command, {add}, result) => {
    add(
      SeededCryptoObjectResponseParameterNames[command],
      (result as ApiCalls.GetSeededCryptoObjectSuccessResponse<typeof command>)[SeededCryptoObjectResponseParameterNames[command]]
    );
});
addResponseMarshallerForCommand(
  [
    ApiCalls.Command.unsealWithSymmetricKey,
    ApiCalls.Command.unsealWithUnsealingKey,
  ],
  (_, {add}, {plaintext}) => {
    add(UnsealSuccessResponseParameterNames.plaintext, urlSafeBase64Encode(plaintext) );
});

const addResponseToUrl = (
  command: ApiCalls.Command,
  responseUrl: string,
  response: ApiCalls.Response,
): URL => {
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
      add(ApiCalls.ExceptionResponseParameterNames.message, message);
    }
    if (stack != null) {
      add(ApiCalls.ExceptionResponseParameterNames.stack, stack);
    }
    return url;
  }

  // Get the correct marshaller for this command and call it.
  const marshaller = commandMarshallers.get(command);
  marshaller?.(command, {add}, response);

  return url;
}

export class QueuedUrlApiRequest extends QueuedApiRequest {
  readonly protocol: string;
  readonly host: string;
  readonly originalRequest: ApiCalls.RequestMessage;
  readonly origin: string;
  readonly pathname: string;
  readonly hostValidatedViaAuthToken: boolean;
  readonly respondTo: string;

  transmitResponseUrl: (responseURL: URL) => void = (url: URL) => {
    if (RUNNING_IN_ELECTRON) {
      (window as unknown as  {ElectronBridge: ElectronBridgeRendererView}).ElectronBridge.openExternal(url.toString());
    } else {
      // console.log(`Transmitting URL`, url.toString())
      window.location.replace(url.toString());
    }
  }

  throwIfClientNotPermitted: () => void = () => throwIfUrlNotPermitted(this)(this.request);

  transmitResponse = (response: ApiCalls.Response, {centerLetterAndDigit, sequenceNumber}: {centerLetterAndDigit?: FaceLetterAndDigit, sequenceNumber?: number}) => {
    // console.log(`Response to be transmitted`, {...response});
    const marshalledResponseUrl = addResponseToUrl( this.request.command, this.respondTo, response);
    if (centerLetterAndDigit != null) {
      marshalledResponseUrl.searchParams.set("centerLetterAndDigit", centerLetterAndDigit);
    }
    if (sequenceNumber != null) {
      marshalledResponseUrl.searchParams.set("#", sequenceNumber.toString());
    }
    this.transmitResponseUrl(marshalledResponseUrl)
  }

  constructor(
    requestUrl: URL
  ) {
    super();
    const decoded = decodeRequestFromUrlIfPresent(requestUrl);
    if (!decoded) {
      throw new Error("Invalid request URL");
    }
    // Should a future version of TypeScript be able to recognize that Object.assign will initialize all the
    // object's parameters, we could replace the below assignments with:
    //   Object.assign(this, decoded);
    const {originalRequest, protocol, host, hostValidatedViaAuthToken, respondTo, origin, pathname} = decoded;
    this.originalRequest = originalRequest as ApiCalls.RequestMessage;
    this.protocol = protocol;
    const replacementHost = (host != null && host.length > 0) ? undefined :  
      KnownCustomProtocolsToTheirAssociatedDomains[protocol] ?? "INVALID";
    // const replacementPath = replacementHost == null ? undefined :
    //   pathname.startsWith("//")
    this.host = replacementHost ?? host;
    // console.log(`host: "${host}", protocol: "${protocol}", this.host="${this.host}"`, host);
    this.hostValidatedViaAuthToken = hostValidatedViaAuthToken;
    this.respondTo = respondTo;
    this.origin = origin;
    this.pathname = pathname;
  }

  /**
   * Get the correct response for a request, spawning a working to do the computation
   * and then caching the result so that it need only be computed once..
   * @param seedString The cryptographic seed for the operation
   * @returns A promise for the requests corresponding response object
   * @throws Exceptions when a request is not permitted.
   */
  async getResponse(seedString: string): Promise<ApiCalls.Response> {
      const {requestId} = this.request;
    if (this.request.command === UrlApiMetaCommand.getAuthToken) {
      // getAuthToken is unique to URL requests  Send an authToken that
      // proves the recipient is able to receive responses at the respondTo URL.
      const authToken = addAuthenticationToken(this.respondTo);
      return {requestId, authToken} as unknown as ApiCalls.Response;
    } else {
      return await super.getResponse(seedString);
    }
  }
}
