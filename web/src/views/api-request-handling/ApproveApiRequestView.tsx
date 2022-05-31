import React from "react";
import {
  ApiCalls, PasswordJson, SealingKeyJson, SecretJson, SignatureVerificationKeyJson, SigningKeyJson, SymmetricKeyJson, UnsealingKeyJson} from "@dicekeys/dicekeys-api-js";
import {
  getKnownHost
} from "../../phrasing/api";
import { observer } from "mobx-react";
import { CenterColumn, ContentBox, Spacer, Instruction2, CompressedContentBox, CenteredCompressedControls } from "../../views/basics";
import { addPreview } from "../../views/basics/Previews";
import { QueuedUrlApiRequest } from "../../api-handler";
import { DiceKeyInHumanReadableForm, DiceKeyWithKeyId, DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";
import { uint8ArrayToHexString } from "../../utilities/convert";
import { PushButton } from "../../css/Button";

import styled from "styled-components";
import { SimpleTopNavBar } from "../Navigation/SimpleTopNavBar";
import { DiceKeyMemoryStore } from "../../state";
import { LoadDiceKeyFullPageView } from "../../views/LoadingDiceKeys/LoadDiceKeyView";
import { DiceKeySelectorView } from "../../views/DiceKeySelectorView";
import { MobxObservedPromise } from "../../utilities/MobxObservedPromise";
import { SequenceNumberInputField } from "../../views/Recipes/DerivationView/RecipeStyles"
import { NumericTextFieldState, NumberPlusMinusView } from "../../views/basics/NumericTextFieldView";
import { ApproveApiRequestState } from "./ApproveApiRequestState";

export const SequenceNumberFormFieldValueView = observer( ({state}: {state: NumericTextFieldState}) => {
  return (
      <NumberPlusMinusView
        key={"#"}
        state={state}
      >
        <SequenceNumberInputField
          value={state.textValue}
          onChange={state.onChangeInTextField}
        />
      </NumberPlusMinusView>
 )});
 
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

const SequenceNumberRow = styled.div`
  align-self: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
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




export const HostDescriptorView = ( {host}: {host: string}) => {
  const knownHost = getKnownHost(host);
  return (knownHost != null) ? (
    <KnownApplicationNameSpan>{ knownHost}</KnownApplicationNameSpan>
  ) : (
    <>the website at <HostNameSpan>{ host }</HostNameSpan></>
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

export const ApiResponsePreview = observer ( <COMMAND extends ApiCalls.Command>(props: {
  command: COMMAND,
  host: string,
  mobxObservedResponse: MobxObservedPromise<ApiCalls.Response> | undefined
}) => {
  const {command, host, mobxObservedResponse} = props;
  const response = mobxObservedResponse?.result;

  return (
    <div style={{display: "flex", flexDirection:"column", alignItems:"center", alignContent: "center"}}>
      <div style={{maxWidth: "80vw", fontFamily: "monospace", borderBottom: "gray solid 1px", minHeight: "1rem"}}>
        { response == null ? "" : ApiResultString(command, response) }
      </div>
      <div style={{color: "rgba(0,0,0,0.666)", fontSize: ".75rem", borderTop: "gray solid 1px"}}>
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

export interface ApproveApiRequestViewProps {
  state: ApproveApiRequestState;
  onApiRequestResolved: () => any;
}

export const ApproveApiRequestView = observer( ({state, onApiRequestResolved}: ApproveApiRequestViewProps) => {
  const { diceKey, loadDiceKeyViewState, request, host, command } = state;

  if (loadDiceKeyViewState != null) {
    return (
      <LoadDiceKeyFullPageView
        onDiceKeyReadOrCancelled={state.onDiceKeyReadOrCancelled}
        state={loadDiceKeyViewState}
      />
    );
  }

  const handleDeclineRequestButton = () => {
    state.transmitDeclinedResponse();
    onApiRequestResolved();
  }

  const handleApproveRequestButton = () => {
    state.transmitSuccessResponse();
    onApiRequestResolved();
  }

  return (
    <>
      <SimpleTopNavBar
        title={`${diceKey?.nickname ?? ""}`} //  using ${diceKey?.nickname ?? ""}
        goBack={handleDeclineRequestButton}
      />
      <Spacer/>
      <RequestDescription>
        <RequestDescriptionView {...{command, host}} />
        <KeyAccessRestrictionsView {...{command, host}} />
      </RequestDescription>
      <ContentBox>
      <CenterColumn>
        <DiceKeySelectorView
          loadRequested={state.startLoadDiceKey}
          selectedDiceKeyId={diceKey?.keyId}
          ratioOfSelectedItemWidthToSelectableItemWidth={`3`}
          selectedItemWidth={`min(40vw, 40vh)`}
          setSelectedDiceKeyId={state.setDiceKeyFromId}
        />
        { diceKey == null ? (
          <>
              <Instruction2>
                You will need your DiceKey to continue.
              </Instruction2>
          </>
        ) : (<>
            <SequenceNumberRow>
              <label>Sequence number</label>
              <SequenceNumberFormFieldValueView state={state.sequenceNumberState} />
            </SequenceNumberRow>
            <ApiResponsePreview
              host={host}
              command={request.command}
              mobxObservedResponse={state.response} />
        </>)}
      </CenterColumn>
      </ContentBox>
      <CompressedContentBox>
        <CenteredCompressedControls>
          <PushButton onClick={handleDeclineRequestButton}>Cancel</PushButton>
          <PushButton invisible={diceKey == null} onClick={handleApproveRequestButton}>{ "Send " + describeCommandResultType(command) }</PushButton>
        </CenteredCompressedControls>
        <CenteredCompressedControls>
            <label>Let <HostDescriptorView host={host}/> know the center die {
              diceKey == null ? null : <>is {diceKey.centerLetterAndDigit}</>
            } so that it can remind you.</label>
            <input type="checkbox" checked />
        </CenteredCompressedControls>
      </CompressedContentBox>
      <Spacer/>
    </>
  )
})

const createPreview = (name: string, urlString: string, ...diceKeys: DiceKeyWithKeyId[]) => {
  addPreview(name, () => {
    diceKeys.forEach( diceKey => DiceKeyMemoryStore.addDiceKeyWithKeyId(diceKey) );
    const request = new QueuedUrlApiRequest(new URL(urlString));
    const state = new ApproveApiRequestState(request, diceKeys[0]);
    return (
      <ApproveApiRequestView
        state={state}
        onApiRequestResolved={() => alert("request resolved")}
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
createPreview("Approve Api Request (key loaded)", msftAccountGetSecretRequestUrl,
  DiceKeyWithKeyId.testExample
);
createPreview("Approve Api Request (more keys loaded)", msftAccountGetSecretRequestUrl,
  new DiceKeyWithKeyId("testA", DiceKeyWithoutKeyId.fromHumanReadableForm("A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm).faces),
  new DiceKeyWithKeyId("testB", DiceKeyWithoutKeyId.fromHumanReadableForm("B2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2t" as DiceKeyInHumanReadableForm).faces),
  new DiceKeyWithKeyId("testC", DiceKeyWithoutKeyId.fromHumanReadableForm("C2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2t" as DiceKeyInHumanReadableForm).faces),
);