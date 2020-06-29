import {
//  Exceptions,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  HtmlComponent
} from "./html-component";
import {
  ComponentEvent
} from "./component-event"
import {
  areDerivationOptionsMutable,
  ProofOfPriorDerivationModule
} from "../api-handler/mutate-derivation-options"
import {
  DiceKey,
  DiceKeyInHumanReadableForm,
  PartialDiceKey
} from "../dicekeys/dicekey";
import {
  ApiCommandParameters,
  SeedStringAndDerivationOptionsForApprovedApiCommand
} from "../api-handler/permission-checked-seed-accessor";
import {
  DiceKeyCanvas,
//  removeAllButCornerLettersFromDiceKey
} from "./dicekey-canvas";
import {
  API,
  describeFrameOfReferenceForReallyBigNumber
} from "../phrasing";
import {
  ScanDiceKey
} from "./scan-dicekey"
import { DiceKeyAppState } from "../state";

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


export class DisplayApiRequest extends HtmlComponent<ApiCommandParameters> {
  protected messageElementId = this.uniqueNodeId("message");
  protected confirmSendResponseButtonId = this.uniqueNodeId("continue-button");
  protected cancelSendResponseButtonId = this.uniqueNodeId("cancel-button");

  protected hintInputTextFieldId = this.uniqueNodeId("hint-text");
  protected hintMessageId = this.uniqueNodeId("hint-message");
  protected removeOrientationToggleButtonId = this.uniqueNodeId("remove-orientation");
  protected strengthMessageTextId = this.uniqueNodeId("strength-message-text");
  protected stregnthFrameOfReferenceTextId = this.uniqueNodeId("strehgth-frame-of-reference-text");

  protected closeWindowUponRespondingCheckboxId = this.uniqueNodeId("close-window-on-responding-checkbox");
  protected forgetDiceKeyAfterRespondingId = this.uniqueNodeId("remember-dicekey-after-responding-checkbox");
  protected rememberDiceKeyForDurationId = this.uniqueNodeId("remember-dicekey-after-duration-checkbox");

  public readonly derivationOptions: DerivationOptions;

//  private get messageDiv(){return document.getElementById(ConfirmOperationDialog.messageElementId) as HTMLDivElement;}
  private get continueButton() {return this.getInputField(this.confirmSendResponseButtonId)!; };
  private get cancelButton() {return this.getInputField(this.cancelSendResponseButtonId)!; }
 
  private get hintInputTextField(){ return this.getInputField(this.hintInputTextFieldId)!; }
  private get hintMessage(){ return this.getField<HTMLDivElement>(this.hintMessageId)!; }
  private get excludeOrientationToggleButton(){
    return this.getInputField(this.removeOrientationToggleButtonId)!;
  }
  private get strengthMessageText(){
    return this.getField<HTMLDivElement>(this.strengthMessageTextId)!;
  }
  private get stregnthFrameOfReferenceText() {
    return this.getField<HTMLDivElement>(this.stregnthFrameOfReferenceTextId)!;
  }
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

  private get cornerLettersClockwise(): string {
    const diceKey = this.diceKey;
    if (typeof diceKey === "undefined") {
      return "";
    }
    return DiceKey.cornerIndexesClockwise
      .map( index => diceKey[index].letter )
      .join("");
  }

  private get numberOfCornerLettersInHint() {
    const hintText = this.hintInputTextField.value.replace(this.hintPrefix, "");
    return this.cornerLettersClockwise.split("")
      // Count the corner letters that appear in the hint text
      .filter( letter => hintText.indexOf( letter ) >= 0 )
      .length;
  }
  
  private get strength(): number {
    const letterCount = 25 - this.numberOfCornerLettersInHint;
    var fromLetters = 1;
    for (var i=2; i <= letterCount; i++) fromLetters *= i;
    const fromDigits = 6 ** 25;
    const fromOrientations: number = 
      this.derivationOptions.excludeOrientationOfFaces ? 1 :
      4 ** 25;
    return fromLetters * fromDigits * fromOrientations;
  }

  private get strengthMessage(): string {
    // ",000" for US factor of 3, ".000" for jurisdctions that use that.
    const zerosForThreeDecimalOrdersOfMagnitude = (1000).toLocaleString().substr(1);

    var strength = this.strength;
    const bits = Math.floor(Math.log2(strength));
    var decimal: string = "";
    while (strength > 1000000000) {
      strength /= 10000;
      decimal += zerosForThreeDecimalOrdersOfMagnitude;
    }
    decimal = Math.floor(strength).toLocaleString() + decimal;

    return `Attakers must guess from ${decimal} possible values (${bits.toLocaleString()} bits of strength)`;
  }

  private get derivationOptionsMutable(): boolean { return areDerivationOptionsMutable(this.derivationOptions); }

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

  private getfinalDerivationOptionsJson = (): string | undefined => {
    const seedString = this.seedString;
    if (seedString == null) {
      return undefined;
    }
    if (!this.derivationOptionsMutable) {
      // We weren't allowed to mutate the derivatio options so leave them unchanged
      return this.options.derivationOptionsJson
    } else {
      return this.proofOfPriorDerivationModule.addToDerivationOptionsJson(seedString, this.derivationOptions)
     }

    return "";
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
    options: ApiCommandParameters,
    private hintPrefix: string = `The DiceKey has corner letters: `
  ) {
    super(options);
    this.derivationOptions = DerivationOptions(this.options.derivationOptionsJson);
  }

  hide21: boolean = true;

  private setDiceKeyCanvas = this.replaceableChild<DiceKeyCanvas | ScanDiceKey>();

  renderDiceKey = (diceKey: PartialDiceKey) => {
    const diceKeyCanvas = this.setDiceKeyCanvas(new DiceKeyCanvas({
      diceKey, // removeAllButCornerLettersFromDiceKey(diceKey),
      size: Math.min(window.innerWidth, window.innerHeight, 768),
      hide21: this.hide21,
      overlayMessage: {
        message: "press to reveal",
        fontFamily: "Sans-Serif",
        fontColor: "#004000",
        fontWeight: 500,
      }
    }));
    diceKeyCanvas.hide21Changed.on( (newHide21) => this.hide21 = newHide21 );
    return diceKeyCanvas;
  }

  renderDiceKeyScanner = () => {
    return this.setDiceKeyCanvas(new ScanDiceKey({}));
  }

  renderDiceKeyOrScanner = () => (this.diceKey == null) ?
    this.renderDiceKeyScanner() :
    this.renderDiceKey(
      this.derivationOptions.excludeOrientationOfFaces ?
        DiceKey.removeOrientations(this.diceKey) :
        this.diceKey
    );

  render() {
    const {command, host} = this.options;
    const diceKey = DiceKeyAppState.instance?.diceKey;

    super.render();

    this.appendHtml(`
      <h2 id="message">${API.describeCommand(command, host, this.priorDerivationProven)}</h2>
      <h3 id="submessage">${API.describeDiceKeyAccessRestritions(host)}</h3>
    `)
    this.appendHtml(`
      <div id="${this.strengthMessageTextId}"></div>
      <div id="${this.stregnthFrameOfReferenceTextId}"></div>
      </div>
    `);
    if (diceKey) { this.appendHtml(`
      <div>
        <label for="${this.hintInputTextFieldId}">Hint</label>
        <input type="text" id="${this.hintInputTextFieldId}" size="60" />
      </div>
    `)}  else if (this.derivationOptions.seedHint != null) { this.appendHtml(`
        <div id="${this.hintMessageId}">></div>
      `);
      this.hintMessage.textContent = this.derivationOptions.seedHint;
    };
    if (diceKey) { this.appendHtml(`
        <div>
        <label for="${this.removeOrientationToggleButtonId}">Remove orientations</label>
        <input type="checkbox" id="${this.removeOrientationToggleButtonId}"/>
      </div>
    `)}
    if (diceKey) { this.appendHtml(`
      <div>
        <label for="${this.rememberDiceKeyForDurationId}">Keep DiceKey in browser for</label>
        <select rememberDiceKeyForDuration="${this.rememberDiceKeyForDurationId}">
        </select>
    `);}
    this.appendHtml(`      </div>
      <div>
        <label for="${this.closeWindowUponRespondingCheckboxId}">Close this tab when responding</label>
        <input type="checkbox" id="${this.closeWindowUponRespondingCheckboxId}"/>
      <div>
      <div>
        <input type="button" id="${this.cancelSendResponseButtonId}" value="Cancel"/>
        <input type="button" id="${this.confirmSendResponseButtonId}" value="Continue"/>
      </div>
    `);
    if (this)
    this.renderDiceKeyOrScanner();


    this.continueButton.addEventListener("click", async () => {
      const seedString = this.seedString;
      const derivationOptionsJson = this.getfinalDerivationOptionsJson();
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

    this.excludeOrientationToggleButton.checked = !!this.derivationOptions.excludeOrientationOfFaces;
    
    if (!this.derivationOptionsMutable) {
      this.excludeOrientationToggleButton.disabled = true;
      this.hintInputTextField.disabled = true;
    } else {
      this.excludeOrientationToggleButton.addEventListener("click", () => {
        this.derivationOptions.excludeOrientationOfFaces = !this.derivationOptions.excludeOrientationOfFaces;
        this.strengthMessageText.textContent = this.strengthMessage;
        this.stregnthFrameOfReferenceText.textContent = describeFrameOfReferenceForReallyBigNumber(this.strength);
        this.renderDiceKeyOrScanner();
        return true;
      });
      this.hintInputTextField.addEventListener("change", () => {
        this.derivationOptions.seedHint = this.hintInputTextField.value;
        this.strengthMessageText.textContent = this.strengthMessage;
        this.stregnthFrameOfReferenceText.textContent = describeFrameOfReferenceForReallyBigNumber(this.strength);
      });
      this.hintInputTextField.addEventListener("keyup", () => {
        this.derivationOptions.seedHint = this.hintInputTextField.value;
        this.strengthMessageText.textContent = this.strengthMessage;
        this.stregnthFrameOfReferenceText.textContent = describeFrameOfReferenceForReallyBigNumber(this.strength);
      });
    }

    this.hintInputTextField.value = this.hintPrefix +
        this.cornerLettersClockwise.split("").join(", ");
    this.strengthMessageText.textContent = this.strengthMessage;
    this.stregnthFrameOfReferenceText.textContent = describeFrameOfReferenceForReallyBigNumber(this.strength);

    if (this.options.command === "getSecret" && this.priorDerivationProven ) {
      // Note that "You are re-creating a secret you have created before."
    } else if (
      this.options.command.startsWith("get") &&
        this.options.command.endsWith("Key") &&
        this.priorDerivationProven
    ) {
      // Note that "You are re-creating a key that you have created before."
    } else if (!this.derivationOptionsMutable && this.derivationOptions.excludeOrientationOfFaces) {
      // This application requires that you disclose your DiceKey without orientations
    } else if (!this.derivationOptionsMutable) {
      // Hide hint field.  Hide orientations field
      // This application does nto support hints or ignoring orientations
    } else {
      // You may set a hint and remove orientations
    }

  }

}
