import React from "react";
import styles from "./api-request-container.module.css";
import {ButtonsCSS, Layout} from "../../css";
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
import { visibility } from "../../utilities/visibility";
import { DiceKey } from "../../dicekeys/DiceKey";
import { uint8ArrayToHexString } from "../../utilities/convert";
import { DiceKeyViewAutoSized } from "../../views/SVG/DiceKeyView";

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
    <span className={styles.known_application_name}>{ knownHost}</span>
  ) : (
    <div>The website at <span className={styles.host_name}>{ host }</span></div>
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
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a password?</div>);
    case "getSecret":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} a secret code?</div>);
    case "getUnsealingKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to {createOrRecreate} keys to encode and decode secrets?</div>);
    case "getSymmetricKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to a {createOrRecreate} key to encode and decode secrets?</div>);
    case "sealWithSymmetricKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to encode a secret?</div>);
    case "unsealWithSymmetricKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to decode a secret?</div>);
    case "unsealWithUnsealingKey":
      return (<div className={styles.request_choice}>May&nbsp;<HostDescriptorView host={host}/>&nbsp;use your { DICEKEY } to decode a secret?</div>);
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
    <div className={styles.request_promise}>
      <HostDescriptorView host={host}/> will not see your {DICEKEY}. They will only receive the {describeCommandResultType(command)}.
    </div>
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
    <div className={Layout.ColumnStretched}>
      <Spacer/>
      <div className={styles.request_description}>
        <RequestDescriptionView {...{command, host}} />
        <KeyAccessRestrictionsView {...{command, host}} />
      </div>
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
            obscureAllButCenterDie={true}
            faces={diceKey.faces}
          />
          <ApiResponsePreview
            host={host}
            command={request.command}
            resultPromise={queuedApiRequest.getResponse(diceKey.toSeedString()) as Promise<ApiCalls.ResponseForCommand<typeof command>> } />
        </ContentBox>
      )}
      <CenteredControls>
        <button className={ButtonsCSS.PushButton} onClick={handleDeclineRequestButton}>Cancel</button>
        <button className={ButtonsCSS.PushButton} style={visibility(diceKey != null)} onClick={handleApproveRequestButton}>{ "Send " + describeCommandResultType(command) }</button>
      </CenteredControls>
      <Spacer/>
    </div>
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
