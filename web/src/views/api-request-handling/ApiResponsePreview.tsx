import React from "react";
import {
  ApiCalls, PasswordJson, SealingKeyJson, SecretJson, SignatureVerificationKeyJson, SigningKeyJson, SymmetricKeyJson, UnsealingKeyJson} from "@dicekeys/dicekeys-api-js";
import { uint8ArrayToHexString } from "../../utilities/convert";

import styled from "styled-components";
import { HostDescriptorView } from "./HostDescriptionView";
import { observer } from "mobx-react";
import { MobxObservedPromise } from "../../utilities/MobxObservedPromise";

export const describeCommandResultType = (command: ApiCalls.Command): string => {
  switch (command) {
    case "getPassword": return "password";
    case "getSecret": return "secret code";
    case "getUnsealingKey": return "unsealing key";
    case "getSymmetricKey": return "symmetric key";
    case "sealWithSymmetricKey": return "sealed message";
    case "unsealWithSymmetricKey": return "decoded secret";
    case "unsealWithUnsealingKey": return "decoded secret";
    // Less common
    case "getSigningKey": return "signing key";
    case "generateSignature": return "signature";
    case "getSignatureVerificationKey": return "signature-verification key";
      // Uncommon
    case "getSealingKey":  return "sealing key";
  }
};


const isAscii = (content: Uint8Array): boolean =>
  content.every( (byte) => {
    byte === 0x09 || // TAB
    byte === 0x0a || // LF
    byte === 0x0d || // CR
    (byte >= 0x20 && byte < 0x7f) // printable characters
  });
const outputStringIfAsciiOrHexOtherwise = (content: Uint8Array) =>
  isAscii(content) ? new TextDecoder().decode(content): uint8ArrayToHexString(content);

export const ApiResultString = <COMMAND extends ApiCalls.Command>(
  command: COMMAND,
  result:  ApiCalls.Response// ApiCalls.ResponseForCommand<COMMAND>
): string => {
  switch (command) {
    case ApiCalls.Command.getSecret:
      return (JSON.parse((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.getSecret>).secretJson) as SecretJson).secretBytes;
    case ApiCalls.Command.getPassword:
      return (JSON.parse((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.getPassword>).passwordJson) as PasswordJson).password;
    case ApiCalls.Command.getSealingKey:
      return (JSON.parse((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.getSealingKey>).sealingKeyJson) as SealingKeyJson).sealingKeyBytes;
    case ApiCalls.Command.getSignatureVerificationKey:
      return (JSON.parse((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.getSignatureVerificationKey>).signatureVerificationKeyJson) as SignatureVerificationKeyJson).signatureVerificationKeyBytes;
    case ApiCalls.Command.getSigningKey:
      return (JSON.parse((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.getSigningKey>).signingKeyJson) as SigningKeyJson).signingKeyBytes;
    case ApiCalls.Command.getSymmetricKey:
      return (JSON.parse((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.getSymmetricKey>).symmetricKeyJson) as SymmetricKeyJson).keyBytes;
    case ApiCalls.Command.getUnsealingKey:
      return (JSON.parse((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.getUnsealingKey>).unsealingKeyJson) as UnsealingKeyJson).unsealingKeyBytes;
    case ApiCalls.Command.generateSignature:
      return uint8ArrayToHexString((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.generateSignature>).signature);
    case ApiCalls.Command.sealWithSymmetricKey:
      return ((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.sealWithSymmetricKey>).packagedSealedMessageJson);
    case ApiCalls.Command.unsealWithUnsealingKey:
    case ApiCalls.Command.unsealWithSymmetricKey:
      return  outputStringIfAsciiOrHexOtherwise((result as ApiCalls.ResponseForCommand<typeof ApiCalls.Command.unsealWithSymmetricKey>).plaintext);
    default:
      return "";
  }
}

const ApiResponsePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
`;

const ReponseContentBox = styled.div`
  max-width: 85vw;
  font-family: monospace;
  border-bottom: gray solid 1px;
  min-height: min(1.35vw, 1.75rem);
  font-size: min(1.35vw, 1.75rem);
`;

const ResponseLabel = styled.div`
  color: rgba(0,0,0,0.666);
  font-size: min(1.25vw, 1.5rem);
  border-top: gray solid 1px;
`

export const ApiResponsePreview = observer ( <COMMAND extends ApiCalls.Command>(props: {
  command: COMMAND,
  host: string,
  mobxObservedResponse: MobxObservedPromise<ApiCalls.Response> | undefined
}) => {
  const {command, host, mobxObservedResponse} = props;
  const response = mobxObservedResponse?.result;

  return (
    <ApiResponsePreviewContainer>
      <ReponseContentBox>
        { response == null ? "" : ApiResultString(command, response) }
      </ReponseContentBox>
      <ResponseLabel>
        {describeCommandResultType(command)} to be sent to <HostDescriptorView host={host}/>
      </ResponseLabel>
    </ApiResponsePreviewContainer>
  )
});