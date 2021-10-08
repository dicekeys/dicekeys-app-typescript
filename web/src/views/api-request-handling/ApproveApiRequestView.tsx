import React from "react";
import {
  ApiCalls, PasswordJson, SealingKeyJson, SecretJson, SignatureVerificationKeyJson, SigningKeyJson, SymmetricKeyJson, UnsealingKeyJson} from "@dicekeys/dicekeys-api-js";
import {
  QueuedApiRequest
} from "../../api-handler/QueuedApiRequest";
import {
  getKnownHost
} from "../../phrasing/api";
import { observer } from "mobx-react";
import { Center, CenteredControls, ContentBox, Spacer } from "../../views/basics";
import { DiceKeyState, SettableDiceKeyState } from "../../state/Window/DiceKeyState";
import { ScanDiceKeyView } from "../../views/LoadingDiceKeys/ScanDiceKeyView";
import { addPreview } from "../../views/basics/Previews";
import { QueuedUrlApiRequest } from "../../api-handler";
import { DiceKey } from "../../dicekeys/DiceKey";
import { uint8ArrayToHexString } from "../../utilities/convert";
import { DiceKeyViewAutoSized } from "../../views/SVG/DiceKeyView";
import { PushButton } from "../../css/Button";
import { FlexColumnWideVerticallyStretched } from "../../css/FlexContainers";

import styled from "styled-components";

const HostNameSpan = styled.span`
  font-family: monospace;
`;

const RequestCommonDiv = styled.div`
  flex-shrink: 0;
  flex-grow: 0;
  font-family: sans-serif;
  text-align: center;
`;

const RequestDescription = styled(RequestCommonDiv)`
  margin-top: 0px;
  margin-bottom: 15;
  color: #202000;
  font-weight: 400;
`;

const RequestChoice = styled(RequestCommonDiv)`
  font-size: 1.6666rem;
  color: #202000;
  font-weight: 400;
`

const RequestPromise = styled(RequestCommonDiv)`
  margin-top: 0.5rem;
  font-size: 1.1rem;
  color: #001000;
  text-align: center;
`;

const KnownApplicationNameSpan = styled.span`
  /* font-family: serif; */
  font-weight: 400;
  /* background-color: rgba(152, 160, 47, 0.1); */
  /* border-radius: 0.3rem; */
  /* text-decoration: rgba(152, 160, 47, 0.2) solid underline 0.2rem; */
`;

// We recommend you never write down your DiceKey (there are better ways to copy it)
// or read it over the phone (which you should never be asked to do), but if you
// had a legitimate reason to, removing orientations make it easier and more reliable.

// By removing orientations from your DiceKey before generating a ___,
// your DiceKey will be more than a quadrillion
// (one million billion) times easier to guess, but the number of possible
// values will still be ... 

// This hint makes your DiceKey 303,600 easier to guess.  However, the number of possible
// guesses is still greater than ... .
// The hint does make it possible for others to know that you used the same  DiceKey for multiple
// accounts.



export interface ApproveApiRequestViewProps {
  queuedApiRequest: QueuedApiRequest;
  settableDiceKeyState: SettableDiceKeyState
  onApiRequestResolved: () => any;
}

export const HostDescriptorView = ( {host}: {host: string}) => {
  const knownHost = getKnownHost(host);
  return (knownHost != null) ? (
    <KnownApplicationNameSpan>{ knownHost}</KnownApplicationNameSpan>
  ) : (
    <div>The website at <HostNameSpan>{ host }</HostNameSpan></div>
  )
}

const DICEKEY = "DiceKey";


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


export const RequestDescriptionView = ({command, host, isRecipeSigned = false}: {
  command: ApiCalls.Command,
  host: string,
  isRecipeSigned?: boolean
}) => {
  const createOrRecreate = isRecipeSigned ?
    "recreate" : "create";
  // use your DiceKey to 
  switch (command) {
    case "getPassword":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a password?</RequestChoice>);
    case "getSecret":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a secret code?</RequestChoice>);
    case "getUnsealingKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to encode and decode secrets?</RequestChoice>);
    case "getSymmetricKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to a {createOrRecreate} key to encode and decode secrets?</RequestChoice>);
    case "sealWithSymmetricKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to encode a secret?</RequestChoice>);
    case "unsealWithSymmetricKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to decode a secret?</RequestChoice>);
    case "unsealWithUnsealingKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to decode a secret?</RequestChoice>);
    // Less common
    case "getSigningKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to sign data?</RequestChoice>);
    case "generateSignature":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to add its digital signature to data?</RequestChoice>);
    case "getSignatureVerificationKey":
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a key used to verify data it has signed?</RequestChoice>);
      // Uncommon
    case "getSealingKey": 
      return (<RequestChoice>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to store secrets?</RequestChoice>);
    // Never
    // default:
    //     throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
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
  result: ApiCalls.ResponseForCommand<COMMAND>
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

export const ApiResponsePreview = observer ( <COMMAND extends ApiCalls.Command>(props: {
  command: COMMAND,
  host: string,
  resultPromise: Promise<ApiCalls.ResponseForCommand<COMMAND>>
}) => {
  const {command, host, resultPromise} = props;
  const [apiResult, setApiResult] = React.useState<ApiCalls.ResponseForCommand<COMMAND> | undefined>(undefined);
  React.useEffect(() => {
    (async () => {
      console.log("attempt to set result");
      setApiResult(await resultPromise);
    })();
  }, []);
  if (apiResult == null) return null;

  return (
    <div style={{display: "flex", flexDirection:"column", alignItems:"center", alignContent: "center"}}>
      <div style={{maxWidth: "80%", fontFamily: "monospace", borderBottom: "gray solid 1px"}}>
        { ApiResultString(command, apiResult) }
      </div>
      <div style={{color: "rgba(0,0,0,0.666)", fontSize: ".75rem"}}>
        {describeCommandResultType(command)} to be sent to <HostDescriptorView host={host}/>
      </div>
    </div>
  )
});


const KeyAccessRestrictionsView = observer( ({command, host}: {command: ApiCalls.Command, host: string}) => (
    <RequestPromise>
      <HostDescriptorView host={host}/> will not see your {DICEKEY}. They will only receive the {describeCommandResultType(command)}.
    </RequestPromise>
  )
);

export const ApproveApiRequestView = observer( (props: ApproveApiRequestViewProps) => {
  const { queuedApiRequest, onApiRequestResolved, settableDiceKeyState } = props;
  const { request, host } = queuedApiRequest;
  const { diceKey } = settableDiceKeyState;
  const { command } = request;
  const handleDeclineRequestButton = () => {
    queuedApiRequest.sendUserDeclined();
    onApiRequestResolved();
  }
  const seedString = diceKey?.toSeedString();

  const handleApproveRequestButton = () => {
    if (seedString) {
      queuedApiRequest.respond(seedString);
    }
    onApiRequestResolved();
  }



  return (
    <FlexColumnWideVerticallyStretched>
      <Spacer/>
      <RequestDescription>
        <RequestDescriptionView {...{command, host}} />
        <KeyAccessRestrictionsView {...{command, host}} />
      </RequestDescription>
      { diceKey == null ? (
        <ContentBox>
          <Spacer/>
          <Center>
            <div style={{fontSize: "1.5rem", fontWeight: 700}}>
              To allow this action, you'll first need to load your DiceKey.
            </div>
          </Center>
          <Spacer/>
          <ScanDiceKeyView
            onDiceKeyRead={settableDiceKeyState.setDiceKey}
          />
          <Spacer/>
        </ContentBox>
      ) : (
        <ContentBox>
          <DiceKeyViewAutoSized
            maxHeight="35vh"
            maxWidth="50vw"
            faces={diceKey.faces}
          />
          <ApiResponsePreview
            host={host}
            command={request.command}
            resultPromise={queuedApiRequest.getResponse(diceKey.toSeedString()) as Promise<ApiCalls.ResponseForCommand<typeof command>> } />
        </ContentBox>
      )}
      <CenteredControls>
        <PushButton onClick={handleDeclineRequestButton}>Cancel</PushButton>
        <PushButton invisible={diceKey == null} onClick={handleApproveRequestButton}>{ "Send " + describeCommandResultType(command) }</PushButton>
      </CenteredControls>
      <Spacer/>
    </FlexColumnWideVerticallyStretched>
  )
})

const createPreview = (name: string, urlString: string, diceKey?: DiceKey) => {
  addPreview(name, () => {
    const settableDiceKeyState = new DiceKeyState(diceKey);
    const request = new QueuedUrlApiRequest(new URL(urlString))
    return (
      <ApproveApiRequestView
        queuedApiRequest={request}
        onApiRequestResolved={() => alert("request resolved")}
        settableDiceKeyState={settableDiceKeyState}
      />
    );
  });
  
}


const msftAccountGetSecretRequestUrl = `https://dicekeys.app/?${""
  }command=getSecret${""
  }&requestId=${"testRequestId" 
  }&recipe=${ encodeURIComponent("{\"allow\":[{\"host\":\"*.account.microsoft.com\"}],\"testBogusField\": false}") 
  }&respondTo=${ encodeURIComponent(`https://account.microsoft.com/--derived-secret-api--/`)
  }${""}`
createPreview("Approve Api Request (no key)", msftAccountGetSecretRequestUrl);
createPreview("Approve Api Request (key loaded)", msftAccountGetSecretRequestUrl, DiceKey.testExample);
