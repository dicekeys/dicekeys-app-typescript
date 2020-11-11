import RenderedOpenDiceKey from "~/images/RenderedOpenDiceKey.png";
import styles from "./api-request-container.module.css";
import layoutStyles from "../layout.module.css";
import {
//  Exceptions,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes,
  Div, InputButton,
  ComponentEvent,
  Button,
  Img
} from "../../web-component-framework";
import {
  DiceKey,
} from "../../dicekeys/dicekey";
import {
  API,
} from "../../phrasing";
import {
  LoadAndStoreDiceKey
} from "../load-and-store-dicekey";
import {
  EncryptedCrossTabState
} from "../../state";
import {
  ApproveApiCommand
} from "./approve-api-command";
import {
  ApiRequestContext
} from "../../api-handler/handle-api-request";
import {
  ConsentResponse
} from "../../api-handler/handle-api-request";
import {
  extraRequestDerivationOptionsAndInstructions
} from "../../api-handler/get-requests-derivation-options-json";
import {
  VerifyDerivationOptionsWorker,
} from "../../workers/call-derivation-options-proof-worker";
import {
  shortDescribeCommandsAction
} from "../../phrasing/api";
import { CenteredControls, Instructions } from "~web-components/basic-building-blocks";

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

export interface ApiRequestOptions extends Attributes {
  requestContext: ApiRequestContext,
  appState: EncryptedCrossTabState,
}

export class ApiRequestContainer extends Component<ApiRequestOptions> {
  protected messageElementId = this.uniqueNodeId("message");

  public readonly derivationOptions: DerivationOptions;
  private areDerivationOptionsVerified: boolean | undefined;
  private static verifyDerivationOptionsWorker = new VerifyDerivationOptionsWorker();

  private userAskedToLoadDiceKey: boolean = false;
  private handleLoadCompleteOrCancel = () => {
    this.userAskedToLoadDiceKey = false;
    this.renderSoon();

  }

  public userApprovedEvent = new ComponentEvent<[ConsentResponse]>(this);
  public userCancelledEvent = new ComponentEvent(this);

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: ApiRequestOptions
  ) {
    super(options);
    this.addClass(layoutStyles.stretched_column_container);
    const {derivationOptionsJson} = extraRequestDerivationOptionsAndInstructions(this.options.requestContext.request);
    this.derivationOptions = DerivationOptions(derivationOptionsJson);
    if (this.derivationOptions.proofOfPriorDerivation) {
      // Once the diceKey is available, calculate if the proof of prior derivation is valid
      EncryptedCrossTabState.instance?.diceKeyField.observe( async (diceKey) => {
        if (diceKey) {
          const seedString = DiceKey.toSeedString(diceKey, !this.derivationOptions.excludeOrientationOfFaces);
          const {verified} = await ApiRequestContainer.verifyDerivationOptionsWorker.calculate({seedString, derivationOptionsJson});
          this.areDerivationOptionsVerified = verified;
          this.renderSoon();
        }
      });
    } else {
      // The DiceKey Does not have a proof of prior derivation.
      this.areDerivationOptionsVerified = false;
    }

  }

  hide21: boolean = true;

  private apiResponseSettings?: ApproveApiCommand;

  private handleCancelButton = () => {
    this.userCancelledEvent.send();
    this.remove();    
  }

  private handleContinueButton = async () => {
    if (!this.apiResponseSettings) {
      return;
    }
    const consentResponse = await this.apiResponseSettings.getResponseReturnUponUsersConsent();
    this.userApprovedEvent.send(consentResponse);
  }

  async render() {
    const {requestContext, appState} = this.options;
    const {request, host} =requestContext;
    const diceKey = appState.diceKey;
    super.render(
      (!diceKey && this.userAskedToLoadDiceKey) ?
        // Load a DiceKey
        new LoadAndStoreDiceKey({
          onExceptionEvent: this.options.onExceptionEvent
        }).with( e => {
          e.completedEvent.on( this.handleLoadCompleteOrCancel );
          e.cancelledEvent.on( this.handleLoadCompleteOrCancel );
        })
      : [
        // Show request
        Div({class: styles.request_description},
          Div({class: styles.request_choice}, API.describeRequestChoice(request.command, host, !!this.areDerivationOptionsVerified) ),
          Div({class: styles.request_promise}, API.describeDiceKeyAccessRestrictions(host) ),
        ),
        ( diceKey ?
          new ApproveApiCommand({...this.options, diceKey}).with( e => this.apiResponseSettings = e )
          :
          Div({class: layoutStyles.centered_column},
            Img({src: RenderedOpenDiceKey, style: 'max-width: 25vw; max-height: 25vh;',
              events: events => events.click.on( () => {
                this.userAskedToLoadDiceKey = true; this.renderSoon(); } ),
            }),
            Instructions(
              `To allow this action, you'll first need to load your DiceKey.`
            ),
            Button({events: events => events.click.on( () => {
              this.userAskedToLoadDiceKey = true;
              this.renderSoon();
            })}, `Load DiceKey`)
          )
        ),
        CenteredControls(
        InputButton({value: "Cancel", clickHandler: this.handleCancelButton}),
        diceKey == null ? undefined :
          InputButton({value: shortDescribeCommandsAction(this.options.requestContext.request.command), clickHandler: this.handleContinueButton} )
        ),
      ]
    );
  }
}
