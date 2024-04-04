import React from "react";
import {
  ApiCalls} from "@dicekeys/dicekeys-api-js";
import { observer } from "mobx-react";
import { Spacer, Instruction2, CompressedContentBox, CenteredCompressedControls, RowCentered } from "../../views/basics";
import { addPreview } from "../../views/basics/Previews";
import { QueuedUrlApiRequest } from "../../api-handler";
import { DiceKeyWithKeyId, DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";
import { DiceKeyInHumanReadableForm } from "../../dicekeys/DiceKey";
import { PushButton } from "../../css/Button";

import styled from "styled-components";
import { DiceKeyMemoryStore } from "../../state";
import { LoadDiceKeyFullPageView } from "../../views/LoadingDiceKeys/LoadDiceKeyView";
import { DiceKeySelectorView } from "../../views/DiceKeySelectorView";
import { SequenceNumberInputField } from "../../views/Recipes/DerivationView/RecipeStyles"
import { NumericTextFieldState, NumberPlusMinusView } from "../../views/basics/NumericTextFieldView";
import { ApproveApiRequestState } from "./ApproveApiRequestState";
import { BuiltInRecipes } from "../../dicekeys";
import { HostDescriptorView } from "./HostDescriptionView";
import { ApiResponsePreview } from "./ApiResponsePreview";
import { RequestDescriptionView } from "./RequestDescriptionView"
import { PrimaryView } from "../../css";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";

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

const RequestPromise = styled(RequestCommonDiv)`
  margin-top: 0.5rem;
  font-size: 1.1rem;
  color: #001000;
  text-align: center;
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


const KeyAccessRestrictionsView = observer( ({command, host}: {command: ApiCalls.Command, host: string}) => (
    <RequestPromise>
      <HostDescriptorView host={host}/> will not see your DiceKey. They will only receive the {describeCommandResultType(command)}.
    </RequestPromise>
  )
);

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
 
 const PrimaryOpaqueView = styled(PrimaryView)`
   background-color: black;
 `

 const SendingMessageContainer = styled.div`
   color: white;
   align-self: center;
 `

const SendingMessageView = () => (
  <PrimaryOpaqueView>
    <SendingMessageContainer>Sending...</SendingMessageContainer>
  </PrimaryOpaqueView>
);

export interface ApproveApiRequestViewProps {
  state: ApproveApiRequestState;
}
export const ApproveApiRequestView = observer( ({state}: ApproveApiRequestViewProps) => {
  const { diceKey, loadDiceKeyViewState, request, host, command } = state;

  if (loadDiceKeyViewState != null) {
    return (
      <LoadDiceKeyFullPageView
        onDiceKeyReadOrCancelled={state.onDiceKeyReadOrCancelled}
        state={loadDiceKeyViewState}
      />
    );
  }
  if (state.sendingResponse && RUNNING_IN_ELECTRON) {
    return (<SendingMessageView/>);
  }

  return (
    <>
      <Spacer/>
      <RequestDescription>
        <RequestDescriptionView {...{command, host}} />
        <KeyAccessRestrictionsView {...{command, host}} />
      </RequestDescription>
      <Spacer/>
      <DiceKeySelectorView
        loadRequested={state.startLoadDiceKey}
        selectedDiceKeyId={diceKey?.keyId}
        $ratioOfSelectedItemWidthToSelectableItemWidth={`3`}
        $selectedItemWidth={`min(40vw, 40vh)`}
        setSelectedDiceKeyId={state.setDiceKeyFromId}
        $rowWidth={`100vw`}
      />
      <Spacer/>
      { diceKey != null ? null : (
        <RowCentered>        
            <Instruction2>
              You will need your DiceKey to continue.
            </Instruction2>
        </RowCentered>
      )}{ diceKey == null ? null : (
          <SequenceNumberRow>
            <label>Sequence number</label>
            <SequenceNumberFormFieldValueView state={state.sequenceNumberState} />
          </SequenceNumberRow>
      )}{ diceKey == null ? null : (
          <ApiResponsePreview
            host={host}
            command={request.command}
            mobxObservedResponse={state.response} />
      )}
      <CompressedContentBox>
        <CenteredCompressedControls>
          <PushButton onClick={state.respondByDeclining}>Cancel</PushButton>
          <PushButton $invisible={diceKey == null} onClick={state.respondSuccessfully}>{ "Send " + describeCommandResultType(command) }</PushButton>
        </CenteredCompressedControls>
        <CenteredCompressedControls>
            <label style={{userSelect: "none"}} onClick={state.toggleRevealCenterLetterAndDigit}>Reveal
            { diceKey == null ? " " : " that "}
             the center die {
              diceKey == null ? null : <>is {diceKey.centerLetterAndDigit}</>
            } so that <HostDescriptorView host={host}/> can remind you next time.</label>
            <input
              type="checkbox"
              checked={state.revealCenterLetterAndDigit}
              onChange={state.toggleRevealCenterLetterAndDigit} />
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
      />
    );
  });
}

const bitwardenAccountGetPasswordRequestUrl = `https://dicekeys.app/?${""
  }command=getPassword${""
  }&requestId=${"testRequestId" 
  }&recipe=${ encodeURIComponent(BuiltInRecipes.find( x => x.name === "Bitwarden")?.recipeJson ?? "" ) 
  }&respondTo=${ encodeURIComponent(`https://vault.bitwarden.com/--derived-secret-api--/`)
  }${""}`;
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
createPreview("Approve Api Request for Bitwarden", bitwardenAccountGetPasswordRequestUrl,
  new DiceKeyWithKeyId("testA", DiceKeyWithoutKeyId.fromHumanReadableForm("A1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1tA1t" as DiceKeyInHumanReadableForm).faces),
  new DiceKeyWithKeyId("testB", DiceKeyWithoutKeyId.fromHumanReadableForm("B2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2tB2t" as DiceKeyInHumanReadableForm).faces),
  new DiceKeyWithKeyId("testC", DiceKeyWithoutKeyId.fromHumanReadableForm("C2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2tC2t" as DiceKeyInHumanReadableForm).faces),
);