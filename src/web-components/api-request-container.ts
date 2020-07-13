import {
//  Exceptions,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  HtmlComponent, Attributes
} from "./html-component";
import {
  //H3, H2,
  Div, InputButton
} from "./html-components";
import {
  ComponentEvent
} from "./component-event"
import {
  ProofOfPriorDerivationModule
} from "../api-handler/mutate-derivation-options"
import {
  DiceKey,
} from "../dicekeys/dicekey";
import {
  API,
} from "../phrasing";
import {
  ScanDiceKey
} from "./scan-dicekey"
import {
  DiceKeyAppState
} from "../state";
import {
  ApproveApiCommand
} from "./approve-api-command";
import {
  ApiRequestContext
} from "../api-handler/handle-api-request";
import {
  ConsentResponse
} from "../api-handler/handle-api-request";
import {
  getRequestsDerivationOptionsJson
} from "../api-handler/get-requests-derivation-options-json";

// We recommend you never write down your DiceKey (there are better ways to copy it)
// or read it over the phone (which you should never be asked to do), but if you
// had a legitimate reason to, removing orientations make it easier and mroe reliable.

// By removing orientnations from your DiceKey before generating a ___,
// your DiceKey will be more than a quadrillion
// (one million billion) times easier to guess, but the number of possible
// values will still be ... 

// This hint makes your DiceKey 303,600 easier to guess.  However, the number of possible
// guesses is still greater than ... .
// The hint does make it possible for others to know that you used the same  DcieKey for mutiple
// accounts.

export interface ApiRequestOptions extends Attributes {
  requestContext: ApiRequestContext
}

export class ApiRequestContainer extends HtmlComponent<ApiRequestOptions> {
  protected messageElementId = this.uniqueNodeId("message");

  public readonly derivationOptions: DerivationOptions;


  public userApprovedEvent = new ComponentEvent<[ConsentResponse]>(this);
  public userCancelledEvent = new ComponentEvent(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: ApiRequestOptions
  ) {
    super(options);
    this.derivationOptions = DerivationOptions(
      getRequestsDerivationOptionsJson(this.options.requestContext.request)
    );
  }

  hide21: boolean = true;

//  private setScanOrResponse?: ReplaceableChild<ApiResponseSettings | ScanDiceKey>;
  private apiResponseSettings?: ApproveApiCommand;

  private handleCancelButton = () => {
    this.userCancelledEvent.send();
    this.remove();    
  }

  private handleContinueButton = () => {
    if (!this.apiResponseSettings) {
      return;
    }
    this.userApprovedEvent.send(this.apiResponseSettings.getResponseReturnUponUsersConsent());

    // if (this.closeWindowUponResponding) {
      setInterval( () => window.close(), 250 );
    // }

    this.remove();
  }

  async render() {
    super.render();
    const {request, host} = this.options.requestContext;
    const diceKey = DiceKeyAppState.instance?.diceKey.value;
    const derivationOptionsJson = getRequestsDerivationOptionsJson(this.options.requestContext.request);
    // FIXME - move calculation to background worker.
    const priorDerivationProven: boolean = !!diceKey && (await (ProofOfPriorDerivationModule.instancePromise))
      .verify(DiceKey.toSeedString(diceKey, derivationOptionsJson), derivationOptionsJson);
    // Re-render whenver the diceKey value changes.
    DiceKeyAppState.instance?.diceKey.changedEvent.on( this.renderSoon );

    this.append(
      Div({class: "request-container"},
        Div({class: "request-choice"}, API.describeRequestChoice(request.command, host, priorDerivationProven) ),
        Div({class: "request-promise"}, API.describeDiceKeyAccessRestrictions(host) ),
        ( diceKey ?
          new ApproveApiCommand(await ProofOfPriorDerivationModule.instancePromise, {...this.options, diceKey}).with( e => this.apiResponseSettings = e )
          :
          new ScanDiceKey({host, derivationOptions: this.derivationOptions})
        ),
        Div({class: "decision-button-container"},
        InputButton({value: "Cancel", clickHandler: this.handleCancelButton}),
        diceKey == null ? undefined :
          InputButton({value: "Continue", clickHandler: this.handleContinueButton} )
        ),
      ),
    );
  }
}
