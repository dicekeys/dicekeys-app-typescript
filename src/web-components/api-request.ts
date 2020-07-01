import {
//  Exceptions,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  HtmlComponent
} from "./html-component";
import {
  H3, H2
} from "./html-components";
import {
  ComponentEvent
} from "./component-event"
import {
  ProofOfPriorDerivationModule
} from "../api-handler/mutate-derivation-options"
import {
  DiceKey,
  DiceKeyInHumanReadableForm,
} from "../dicekeys/dicekey";
import {
  ApiCommandParameters,
  SeedStringAndDerivationOptionsForApprovedApiCommand
} from "../api-handler/permission-checked-seed-accessor";
import {
  API,
} from "../phrasing";
import {
  ScanDiceKey
} from "./scan-dicekey"
import { DiceKeyAppState } from "../state";
import { ApiResponseSettings } from "./api-response-settings";

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


export class ApiRequest extends HtmlComponent<ApiCommandParameters> {
  protected messageElementId = this.uniqueNodeId("message");
  protected confirmSendResponseButtonId = this.uniqueNodeId("continue-button");
  protected cancelSendResponseButtonId = this.uniqueNodeId("cancel-button");

  // protected hintMessageId = this.uniqueNodeId("hint-message");

  protected closeWindowUponRespondingCheckboxId = this.uniqueNodeId("close-window-on-responding-checkbox");
  protected forgetDiceKeyAfterRespondingId = this.uniqueNodeId("remember-dicekey-after-responding-checkbox");
  protected rememberDiceKeyForDurationId = this.uniqueNodeId("remember-dicekey-after-duration-checkbox");

  public readonly derivationOptions: DerivationOptions;

//  private get messageDiv(){return document.getElementById(ConfirmOperationDialog.messageElementId) as HTMLDivElement;}
  private get continueButton() {return this.getInputField(this.confirmSendResponseButtonId)!; };
  private get cancelButton() {return this.getInputField(this.cancelSendResponseButtonId)!; }
 
  // private get hintMessage(){ return this.getField<HTMLDivElement>(this.hintMessageId)!; }
  private get closeWindowUponRespondingCheckbox(){
    return this.getInputField(this.closeWindowUponRespondingCheckboxId)!;
  }
  private get closeWindowUponResponding() {
    return this.closeWindowUponRespondingCheckbox.checked;
  }

  private get diceKey(): DiceKey | undefined {
    const diceKey = DiceKeyAppState.instance?.diceKey;
    if (diceKey == null) {
      return undefined;
    }
    return DiceKey.applyDerivationOptions(diceKey, this.derivationOptions);
  }

  private get seedString(): DiceKeyInHumanReadableForm | undefined {
    if (this.diceKey == null) {
      return undefined;
    }
    return DiceKey.toSeedString( this.diceKey, this.derivationOptions );
  }

  private priorDerivationProvenCalculateOnlyOnce?: boolean;
  protected get priorDerivationProven(): boolean {
    if (this.seedString == null) {
      return false;
    } 
    if (this.priorDerivationProvenCalculateOnlyOnce == null) {
      this.priorDerivationProvenCalculateOnlyOnce = this.proofOfPriorDerivationModule.verify(
        this.seedString, this.derivationOptions
      );
    }
    return this.priorDerivationProvenCalculateOnlyOnce!;
  }

  public userApprovedEvent = new ComponentEvent<[SeedStringAndDerivationOptionsForApprovedApiCommand]>(this);
  public userCancelledEvent = new ComponentEvent(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    private proofOfPriorDerivationModule: ProofOfPriorDerivationModule,
    options: ApiCommandParameters
  ) {
    super(options);
    this.derivationOptions = DerivationOptions(this.options.derivationOptionsJson);
  }

  hide21: boolean = true;

  private setScanOrResponse = this.replaceableChild<ApiResponseSettings | ScanDiceKey>();
  private apiResponseSettings?: ApiResponseSettings;

  async render() {
    super.render();
    const {command, host} = this.options;
    const diceKey = DiceKeyAppState.instance?.diceKey;

    this.append(
      H2({class: "request-choice"}).with( c => c.append( API.describeRequestChoice(command, host, this.priorDerivationProven) ) ),
      H3({class: "request-promise"}).with( c => c.append( API.describeDiceKeyAccessRestrictions(host) ) )
    );
    // this.appendHtml(`
    //   <h2 id="message">${API.describeCommand(command, host, this.priorDerivationProven)}</h2>
    //   <h3 id="submessage">${API.describeDiceKeyAccessRestritions(host)}</h3>
    // `)
    this.appendHtml(`      
      <div>
        <label for="${this.closeWindowUponRespondingCheckboxId}">Close this tab when responding</label>
        <input type="checkbox" id="${this.closeWindowUponRespondingCheckboxId}"/>
      <div>
      <div>
        <input type="button" id="${this.cancelSendResponseButtonId}" value="Cancel"/>
        <input type="button" id="${this.confirmSendResponseButtonId}" value="Continue"/>
      </div>
    `);    
    // if (!diceKey && this.derivationOptions.seedHint != null) { this.appendHtml(`
    //     <div id="${this.hintMessageId}">></div>
    //   `);
    //   this.hintMessage.textContent = this.derivationOptions.seedHint;
    // };   
    if (!diceKey) {
      this.continueButton.style.setProperty("visibility", "hidden");
    }
    this.setScanOrResponse(
      diceKey ?
        this.apiResponseSettings = new ApiResponseSettings(
          await ProofOfPriorDerivationModule.instancePromise,
          {
            ...this.options,
            diceKey
          }
        )
        :
        new ScanDiceKey({
          msDelayBetweenSuccessAndClosure: 250,
          host,
          derivationOptions: this.derivationOptions
        })
    );

    this.continueButton.addEventListener("click", async () => {
      const seedString = this.seedString;
      const derivationOptionsJson = this.apiResponseSettings?.finalDerivationOptionsJson;
      if (seedString != null && derivationOptionsJson != null) {
        this.userApprovedEvent.send({seedString, derivationOptionsJson});
      }

      if (this.closeWindowUponResponding) {
        setInterval( () => window.close(), 250 );
      }

      this.remove();
    });
    this.cancelButton.addEventListener("click", () => {
      this.userCancelledEvent.send();
      this.remove();
    });

  }
}
