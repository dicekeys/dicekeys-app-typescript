import {
  ApiCalls,
  ApiStrings,
  Exceptions,
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfUrlNotPermitted
} from "./url-permission-checks";
import {
  handleApiRequest,
  ApiRequestContext,
  ConsentResponse
} from "./handle-api-request";
import { urlSafeBase64Decode, urlSafeBase64Encode } from "../api/encodings";
import {
  GenerateSignatureRequest,
  GetPasswordRequest,
  GetSealingKeyRequest,
  GetSecretRequest,
  GetSignatureVerificationKeyRequest,
  GetSigningKeyRequest,
  GetSymmetricKeyRequest,
  GetUnsealingKeyRequest,
  SealWithSymmetricKeyRequest,
  UnsealWithSymmetricKeyRequest,
  UnsealWithUnsealingKeyRequest
} from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {
  PackagedSealedMessageJson,
  SignatureVerificationKeyJson,
  SealingKeyJson,
  SecretJson,
  SigningKeyJson,
  SymmetricKeyJson,
  UnsealingKeyJson
} from "@dicekeys/seeded-crypto-js";
import {
  EncryptedCrossTabState
} from "../state";
const {
  Inputs,
  Outputs,
  Commands
} = ApiStrings;

interface MarshallCommand<COMMAND extends ApiStrings.Command> {
  (
    marhsallers: {
      add: (fieldName: string, value: string) => void,
      addJSON: <T>(fieldName: string, t: T) => void,
    },
    response: ApiCalls.ResponseForCommand<COMMAND>,
  ): void
}

// Since TypeScript doesn't do type inference on switch statements well enough,
// this function allows us to simulate a properly typed switch case statement.
const commandMarshallers = new Map<ApiStrings.Command, MarshallCommand<ApiStrings.Command>>();
const addResponseMarshallerForCommand = <COMMAND extends ApiStrings.Command>(
  forCommand: COMMAND,
  callback: MarshallCommand<COMMAND>
): void => {
  commandMarshallers.set(forCommand, callback);
}
addResponseMarshallerForCommand(
  Commands.generateSignature,
  ({add, addJSON}, {signature, signatureVerificationKeyFields}) => {
  const {signatureVerificationKeyBytes, derivationOptionsJson} = signatureVerificationKeyFields;
    add(Outputs.generateSignature.signature, urlSafeBase64Encode(signature));
    addJSON<SignatureVerificationKeyJson>(Outputs.generateSignature.signatureVerificationKeyFields, {
      derivationOptionsJson,
      signatureVerificationKeyBytes: urlSafeBase64Encode(signatureVerificationKeyBytes)      
    })
});
addResponseMarshallerForCommand(
  Commands.getPassword,
  ({add}, {password, derivationOptionsJson}) => {
    add(Outputs.getPassword.password, password);
    add(Outputs.getPassword.derivationOptionsJson, derivationOptionsJson);
});
addResponseMarshallerForCommand(
  Commands.getSealingKey,
  ({addJSON}, {sealingKeyFields}) => {
    const {derivationOptionsJson, sealingKeyBytes} = sealingKeyFields;
    addJSON<SealingKeyJson>(Outputs.getSealingKey.sealingKeyFields, {
      derivationOptionsJson,
      sealingKeyBytes: urlSafeBase64Encode(sealingKeyBytes)
    });
});
addResponseMarshallerForCommand(
  Commands.getSecret,
  ({addJSON}, {secretFields}) => {
    const {derivationOptionsJson, secretBytes} = secretFields;
    addJSON<SecretJson>(Outputs.getSecret.secretFields, {
      derivationOptionsJson,
      secretBytes: urlSafeBase64Encode(secretBytes)
    });
});
addResponseMarshallerForCommand(
  Commands.getSignatureVerificationKey,
  ({addJSON}, {signatureVerificationKeyFields}) => {
    const {derivationOptionsJson, signatureVerificationKeyBytes} = signatureVerificationKeyFields;
    addJSON<SignatureVerificationKeyJson>(Outputs.getSignatureVerificationKey.signatureVerificationKeyFields, {
      derivationOptionsJson,
      signatureVerificationKeyBytes: urlSafeBase64Encode(signatureVerificationKeyBytes)
  });
});
addResponseMarshallerForCommand(
  Commands.getSigningKey,
  ({addJSON}, {signingKeyFields}) => {
    const {derivationOptionsJson, signatureVerificationKeyBytes, signingKeyBytes} = signingKeyFields;
    addJSON<SigningKeyJson>(Outputs.getSigningKey.signingKeyFields, {
      derivationOptionsJson,
      signingKeyBytes: urlSafeBase64Encode(signingKeyBytes),
      ...( signatureVerificationKeyBytes == null ? {} : {
          signatureVerificationKeyBytes: urlSafeBase64Encode(signatureVerificationKeyBytes)
      })
    });
});
addResponseMarshallerForCommand(
  Commands.getSymmetricKey,
  ({addJSON}, {symmetricKeyFields}) => {
    const {derivationOptionsJson, keyBytes} = symmetricKeyFields;
    addJSON<SymmetricKeyJson>(Outputs.getSymmetricKey.symmetricKeyFields, {
      derivationOptionsJson,
      keyBytes: urlSafeBase64Encode(keyBytes)
    });
});
addResponseMarshallerForCommand(
  Commands.getUnsealingKey,
  ({addJSON}, {unsealingKeyFields}) => {
    const {derivationOptionsJson, unsealingKeyBytes, sealingKeyBytes} = unsealingKeyFields;
    addJSON<UnsealingKeyJson>(Outputs.getUnsealingKey.unsealingKeyFields, {
      derivationOptionsJson,
      unsealingKeyBytes: urlSafeBase64Encode(unsealingKeyBytes),
      sealingKeyBytes: urlSafeBase64Encode(sealingKeyBytes)
    });
});
addResponseMarshallerForCommand(
  Commands.sealWithSymmetricKey,
  ({addJSON}, {packagedSealedMessageFields}) => {
    const {derivationOptionsJson, ciphertext, unsealingInstructions} = packagedSealedMessageFields;
    addJSON<PackagedSealedMessageJson>(Outputs.sealWithSymmetricKey.packagedSealedMessageFields, {
      derivationOptionsJson, unsealingInstructions,
      ciphertext: urlSafeBase64Encode(ciphertext)
    });
});
addResponseMarshallerForCommand(
  Commands.unsealWithSymmetricKey,
  ({add}, {plaintext}) => {
    add(Outputs.unsealWithSymmetricKey.plaintext, urlSafeBase64Encode(plaintext) );
});
addResponseMarshallerForCommand(
  Commands.unsealWithUnsealingKey,
  ({add}, {plaintext}) => {
    add(Outputs.unsealWithUnsealingKey.plaintext, urlSafeBase64Encode(plaintext) );
});

const addResponseToUrl = (
  command: ApiStrings.Command,
  responseUrl: string,
  response: ApiCalls.Response,
): string => {
  // Construct a response URL onto which we can add resposne parameters
  const url = new URL(responseUrl);
  // Syntatic sugar for marshalling responses into the URL
  const add = (name: string, value: string) => url.searchParams.set(name, value);
  const addJSON = <T>(fieldName: string, t: T) => add(fieldName, JSON.stringify(t));
  // Always copy the requestId back into the response
  add(Outputs.COMMON.requestId, response.requestId);

  // Marshall exceptions if thrown.
  if ("exception" in response) {
    const {exception, message, stack} = response;
    add(Outputs.COMMON.exception, exception);
    if (message != null) {
      add(Outputs.COMMON.message, message);
    }
    if (stack != null) {
      add(Outputs.COMMON.stack, stack);
    }
    return url.toString();
  }

  // Get the correct marshaller for this command and call it.
  const marshaller = commandMarshallers.get(command);
  marshaller?.({add, addJSON}, response);

  return url.toString();
}

const getRequestFromSearchParams = (
  searchParams: URLSearchParams
): ApiCalls.ApiRequestObject | undefined => {
  const command = searchParams.get(ApiStrings.Inputs.COMMON.command) ?? undefined;
  if (command == null) {
    return undefined;
  }
  if (!ApiStrings.isCommand(command)) {
    throw new Exceptions.InvalidCommand(`Invalid API command: ${command}`);
  }
  const requireParam = (paramName: string) => searchParams.get(paramName) ??
    (() => { throw new Exceptions.MissingParameter(`Command ${command} missing parameter ${paramName}.`);} )();
  
  switch (command) {
    case Commands.generateSignature:
      return {
        command,
        [Inputs.generateSignature.derivationOptionsJson]: requireParam(Inputs.withDerivationOptions.derivationOptionsJson),
        [Inputs.generateSignature.message]: urlSafeBase64Decode(requireParam(Inputs.generateSignature.message))
      } as GenerateSignatureRequest;
    case Commands.getPassword:
    case Commands.getSealingKey:
    case Commands.getSecret:
    case Commands.getSignatureVerificationKey:
    case Commands.getSigningKey:
    case Commands.getSymmetricKey:
    case Commands.getUnsealingKey:
      return {
        command,
        [Inputs.withDerivationOptions.derivationOptionsJson]: requireParam(Inputs.withDerivationOptions.derivationOptionsJson),
      } as GetPasswordRequest | GetSealingKeyRequest | GetSecretRequest | GetSignatureVerificationKeyRequest | GetSigningKeyRequest | GetSymmetricKeyRequest | GetUnsealingKeyRequest;
    case Commands.sealWithSymmetricKey: {
      const unsealingInstructions = searchParams.get(Inputs.sealWithSymmetricKey.unsealingInstructions) ?? undefined;
      return {
        command,
        [Inputs.sealWithSymmetricKey.derivationOptionsJson]: requireParam(Inputs.sealWithSymmetricKey.derivationOptionsJson),
        [Inputs.sealWithSymmetricKey.plaintext]: urlSafeBase64Decode(requireParam(Inputs.sealWithSymmetricKey.plaintext)),
        ...( unsealingInstructions == null ? {} :{unsealingInstructions}
        )
      } as SealWithSymmetricKeyRequest;
    }
    case Commands.unsealWithSymmetricKey:
    case Commands.unsealWithUnsealingKey: {
      const packagedSealedMessageJson = requireParam(Inputs.unsealing.packagedSealedMessageFields);
      const {ciphertext, derivationOptionsJson, unsealingInstructions} = JSON.parse(packagedSealedMessageJson) as PackagedSealedMessageJson;
      return {
        command,
        [Inputs.unsealing.packagedSealedMessageFields]: {
          ciphertext: urlSafeBase64Decode(ciphertext),
          derivationOptionsJson,
          ...( unsealingInstructions == null ? {} : {unsealingInstructions}
          )
        }
      } as UnsealWithSymmetricKeyRequest | UnsealWithUnsealingKeyRequest;
    }
  }
  throw new Exceptions.InvalidCommand(command);
}

const getRequestContextFromUrl = (
  requestUrl: URL
): undefined | (ApiRequestContext & {hostValidatedViaAuthToken: boolean, respondTo: string, origin: string, pathname: string}) => {
  const {searchParams} = requestUrl;
  var respondTo = searchParams.get(ApiStrings.Inputs.COMMON.respondTo);
  var hostValidatedViaAuthToken = false;
  const requestId = searchParams.get(ApiStrings.Inputs.COMMON.requestId);
  const authToken = searchParams.get(ApiStrings.Inputs.COMMON.authToken) ?? undefined;
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
  const request = getRequestFromSearchParams(requestUrl.searchParams);
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
  if (requestUrl.searchParams.get(Inputs.COMMON.command) === ApiStrings.MetaCommands.getAuthToken) {
    // Special case request for authentication tokens.
    const respondTo = requestUrl.searchParams.get(ApiStrings.Inputs.COMMON.respondTo);
    const requestId = requestUrl.searchParams.get(ApiStrings.Inputs.COMMON.requestId);
    if (typeof respondTo === "string" && typeof requestId === "string") {
      const responseUrl = new URL(respondTo);
      const authToken = EncryptedCrossTabState.instance?.addAuthenticationToken(respondTo);
      responseUrl.searchParams.set(Outputs.COMMON.requestId, requestId);
      if (authToken) {
        responseUrl.searchParams.set(Outputs.getAuthToken.authToken, authToken);
      }
      transmitResponseUrl(responseUrl.toString());
    }
    return;
  }
  const processedRequest = getRequestContextFromUrl(requestUrl);
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
