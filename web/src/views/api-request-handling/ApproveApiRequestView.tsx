import React from "react";
import styles from "./api-request-container.module.css";
import {ButtonsCSS, Layout} from "../../css";
import {
  ApiCalls} from "@dicekeys/dicekeys-api-js";
import {
  QueuedApiRequest
} from "../../api-handler/QueuedApiRequest";
import {
  getKnownHost,
  shortDescribeCommandsAction
} from "../../phrasing/api";
import { observer } from "mobx-react";
import { CenteredControls } from "../../views/basics";
import { addPreview } from "../../views/basics/Previews";

import {QueuedUrlApiRequest} from "../../api-handler/QueuedUrlApiRequest";
;// We recommend you never write down your DiceKey (there are better ways to copy it)
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
  onApiRequestResolved: () => any;
}

export const HostDescriptorView = ( {host, capitalize}: {host: string, capitalize?: boolean}) => {
  const knownHost = getKnownHost(host);
  return (knownHost != null) ? (
    <span className={styles.known_application_name}>{ knownHost}</span>
  ) : (<>
    <span>{capitalize ? "T":"t"}he website at&nbsp;</span><span className={styles.host_name}>{ host }</span>
  </>)
}

const DICEKEY = "DiceKey";


export const RequestDescriptionView = observer ( ({command, host, isRecipeSigned = false}: {
  command: ApiCalls.Command,
  host: string,
  isRecipeSigned?: boolean
}) => {
  const createOrRecreate = isRecipeSigned ?
    "recreate" : "create";
  // use your DiceKey to 
  switch (command) {
    case "getPassword":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a password?</div>);
    case "getSecret":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a secret security code?</div>);
    case "getUnsealingKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to encode and decode secrets?</div>);
    case "getSymmetricKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to a {createOrRecreate} key to encode and decode secrets?</div>);
    case "sealWithSymmetricKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to encode a secret?</div>);
    case "unsealWithSymmetricKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to allow to decode a secret?</div>);
    case "unsealWithUnsealingKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to allow to decode a secret?</div>);
    // Less common
    case "getSigningKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to sign data?</div>);
    case "generateSignature":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to add its digital signature to data?</div>);
    case "getSignatureVerificationKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a key used to verify data it has signed?</div>);
      // Uncommon
    case "getSealingKey": 
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to store secrets?</div>);
    // Never
    // default:
    //     throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
  }
}
);

const KeyAccessRestrictionsView = observer( ({host}: {host: string}) => (
    <div className={styles.request_promise}>
      <HostDescriptorView host={host} capitalize={true}/> will not see your {DICEKEY}
    </div>
  )
);

export const ApproveApiRequestView = observer( (props: ApproveApiRequestViewProps) => {
  const { queuedApiRequest, onApiRequestResolved } = props;
  const { request, host } = queuedApiRequest;
  const { command } = request;
  const handleDeclineRequestButton = () => {
    queuedApiRequest.sendUserDeclined();
    onApiRequestResolved();
  }

  const handleApproveRequestButton = () => {
//    queuedApiRequest.respond(seedString);
    onApiRequestResolved();
  }

  return (
    <div className={Layout.ColumnStretched}>
      <div className={styles.request_description}>
        <RequestDescriptionView {...{command, host}} />
        <KeyAccessRestrictionsView host={host} />
      </div>
      <CenteredControls>
        <button className={ButtonsCSS.PushButton} onClick={handleDeclineRequestButton}>Cancel</button>
        <button className={ButtonsCSS.PushButton} hidden={true} onClick={handleApproveRequestButton}>{ shortDescribeCommandsAction(command) }</button>
      </CenteredControls>
    </div>
  )
})

addPreview("ApproveApiRequest", () => {
  const request = new QueuedUrlApiRequest(new URL(
    `https://dicekeys.app/?${""
    }command=getSecret${""
    }&requestId=${ encodeURIComponent("{\"testBogusField\": false}") 
    }&respondTo=${ encodeURIComponent(`https://account.microsoft.com/--derived-secret-api--/`)
    }${""}`
  ));
  return (
    <ApproveApiRequestView
      queuedApiRequest={request}
      onApiRequestResolved={() => alert("request resolved")}
    />
  );
});

//   async render() {
//     const {requestContext, appState} = this.options;
//     const {request, host} =requestContext;
//     const diceKey = appState.diceKey;
//     super.render(
//       (!diceKey && this.userAskedToLoadDiceKey) ?
//         // Load a DiceKey
//         new LoadAndStoreDiceKey({
//           onExceptionEvent: this.options.onExceptionEvent
//         }).with( e => {
//           e.completedEvent.on( this.handleLoadCompleteOrCancel );
//           e.cancelledEvent.on( this.handleLoadCompleteOrCancel );
//         })
//       : [
//         // Show request
//         Div({class: styles.request_description},
//           Div({class: styles.request_choice}, API.describeRequestChoice(request.command, host, !!this.areRecipeVerified) ),
//           Div({class: styles.request_promise}, API.describeDiceKeyAccessRestrictions(host) ),
//         ),
//         ( diceKey ?
//           new ApproveApiCommand({...this.options, diceKey}).with( e => this.apiResponseSettings = e )
//           :
//           Div({class: layoutStyles.CenteredColumn},
//             Img({src: RenderedOpenDiceKey, style: 'max-width: 25vw; max-height: 25vh;',
//               events: events => events.click.on( () => {
//                 this.userAskedToLoadDiceKey = true; this.renderSoon(); } ),
//             }),
//             Instructions(
//               `To allow this action, you'll first need to load your DiceKey.`
//             ),
//             Button({events: events => events.click.on( () => {
//               this.userAskedToLoadDiceKey = true;
//               this.renderSoon();
//             })}, `Load DiceKey`)
//           )
//         ),
//         CenteredControls(
//         InputButton({value: "Cancel", clickHandler: this.handleCancelButton}),
//         diceKey == null ? undefined :
//           InputButton({value: shortDescribeCommandsAction(this.options.requestContext.request.command), clickHandler: this.handleContinueButton} )
//         ),
//       ]
//     );
//   }
// }
