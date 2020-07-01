import {
//  Exceptions,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  HtmlComponent
} from "./html-component";
import {
  areDerivationOptionsMutable,
  ProofOfPriorDerivationModule
} from "../api-handler/mutate-derivation-options"
import {
  DiceKey,
  DiceKeyInHumanReadableForm,
} from "../dicekeys/dicekey";
import {
  ApiCommandParameters,
} from "../api-handler/permission-checked-seed-accessor";
import {
  DiceKeyCanvas,
//  removeAllButCornerLettersFromDiceKey
} from "./dicekey-canvas";
import {
  describeFrameOfReferenceForReallyBigNumber
} from "../phrasing";
import { 
  Div,
  Label,
  TextInput
} from "./html-components";

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

export interface ApiResponseSettingsOptions extends ApiCommandParameters {
  diceKey: DiceKey
}

export class ApiResponseSettings extends HtmlComponent<ApiResponseSettingsOptions> {

  protected hintInputTextFieldId = this.uniqueNodeId("hint-text");
  protected hintMessageId = this.uniqueNodeId("hint-message");
  protected removeOrientationToggleButtonId = this.uniqueNodeId("remove-orientation");
  // protected strengthMessageTextId = this.uniqueNodeId("strength-message-text");
  // protected stregnthFrameOfReferenceTextId = this.uniqueNodeId("strehgth-frame-of-reference-text");

  protected forgetDiceKeyAfterRespondingId = this.uniqueNodeId("remember-dicekey-after-responding-checkbox");
  protected rememberDiceKeyForDurationId = this.uniqueNodeId("remember-dicekey-after-duration-checkbox");

  public readonly derivationOptions: DerivationOptions;

//  private get messageDiv(){return document.getElementById(ConfirmOperationDialog.messageElementId) as HTMLDivElement;}
 
  // private get hintInputTextField(){ return this.getInputField(this.hintInputTextFieldId)!; }
  private get hintMessage(){ return this.getField<HTMLDivElement>(this.hintMessageId)!; }
  private get excludeOrientationToggleButton(){
    return this.getInputField(this.removeOrientationToggleButtonId)!;
  }
  // private get strengthMessageText(){
  //   return this.getField<HTMLDivElement>(this.strengthMessageTextId)!;
  // }
  // private get stregnthFrameOfReferenceText() {
  //   return this.getField<HTMLDivElement>(this.stregnthFrameOfReferenceTextId)!;
  // }

  private get diceKey(): DiceKey {
    return DiceKey.applyDerivationOptions(this.options.diceKey, this.derivationOptions);
  }

  private get seedString(): DiceKeyInHumanReadableForm {
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

  
  private get strength(): number {
    const letterCount = 25; // FIXME - this.?.length || 0;
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

  public get derivationOptionsMutable(): boolean { return areDerivationOptionsMutable(this.derivationOptions); }

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

  public get finalDerivationOptionsJson(): string {
    if (!this.derivationOptionsMutable) {
      // We weren't allowed to mutate the derivatio options so leave them unchanged
      return this.options.derivationOptionsJson
    } else {
      return this.proofOfPriorDerivationModule.addToDerivationOptionsJson(this.seedString, this.derivationOptions)
    }
  }
 
  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    private proofOfPriorDerivationModule: ProofOfPriorDerivationModule,
    options: ApiResponseSettingsOptions
) {
    super(options);
    this.derivationOptions = DerivationOptions(this.options.derivationOptionsJson);
  }

  hide21: boolean = true;
  private setDiceKeyCanvas = this.replaceableChild<DiceKeyCanvas>();

  renderDiceKey = () => {
    const diceKeyCanvas = this.setDiceKeyCanvas(new DiceKeyCanvas({
      diceKey: this.derivationOptions.excludeOrientationOfFaces ?
        DiceKey.removeOrientations(this.diceKey) :
        this.diceKey,
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

  protected updateStrength = () => {
    // this.strengthMessageText.textContent = this.strengthMessage;
    // this.stregnthFrameOfReferenceText.textContent = describeFrameOfReferenceForReallyBigNumber(this.strength);
  }

  // protected updateHint = () => {
  //   this.derivationOptions.seedHint = this.hintInputTextField.value;
  //   this.updateStrength();
  // }

  render() {
    super.render();

    // this.append(`
    //   <div id="${this.strengthMessageTextId}"></div>
    //   <div id="${this.stregnthFrameOfReferenceTextId}"></div>
    //   </div>
    // `);
    if (this.derivationOptionsMutable) {
      var label: Label | undefined;
      this.append( Div().append(
        label = Label({text: "Hint"}),
        TextInput().with( t => { 
          t.primaryElement.setAttribute("size", "60")
          t.value = this.cornerLettersClockwise.split("").join("");
          label?.primaryElement.setAttribute("for", t.primaryElementId)
          t.changed.on( () => {
            this.derivationOptions.seedHint = t.value;
          })
        })
      ));
      //   ,
      //   `
      //   <div>
      //     <label for="${this.hintInputTextFieldId}">Hint</label>
      //     <input type="text" id="${this.hintInputTextFieldId}" size="60" />
      //   </div>
      // `
    }
    this.append(`
      <div>
        <label for="${this.removeOrientationToggleButtonId}">Remove orientations</label>
        <input type="checkbox" id="${this.removeOrientationToggleButtonId}"/>
      </div>
      <div>
        <label for="${this.rememberDiceKeyForDurationId}">Forget DiceKey immediately after responding</label>
        <select rememberDiceKeyForDuration="${this.rememberDiceKeyForDurationId}">
        </select>
      </div>
      <div>
    `);
    // Add a hint for when you need to find the same DiceKey to [re-generate this [key|secret] [unseal this message].

    // Clear DiceKey [immediately after responding], [after 5 more minutes], [after an hour], [only when I ask]
    
    // This tab will close when you respond.
    // If you want to do more with this DiceKey than just respond to this request, open another dicekeys.app tab.

    if (this)
    this.renderDiceKey();

    this.excludeOrientationToggleButton.checked = !!this.derivationOptions.excludeOrientationOfFaces;
    
    if (!this.derivationOptionsMutable) {
      this.excludeOrientationToggleButton.disabled = true;
    } else {

      this.excludeOrientationToggleButton.addEventListener("click", () => {
        this.derivationOptions.excludeOrientationOfFaces = !this.derivationOptions.excludeOrientationOfFaces;
        this.updateStrength();
        this.renderDiceKey();
        return true;
      });
//      this.hintInputTextField.addEventListener("keyup", this.updateHint);
    }

    this.updateStrength();

    // if (this.options.command === "getSecret" && this.priorDerivationProven ) {
    //   // Note that "You are re-creating a secret you have created before."
    // } else if (
    //   this.options.command.startsWith("get") &&
    //     this.options.command.endsWith("Key") &&
    //     this.priorDerivationProven
    // ) {
    //   // Note that "You are re-creating a key that you have created before."
    // } else if (!this.derivationOptionsMutable && this.derivationOptions.excludeOrientationOfFaces) {
    //   // This application requires that you disclose your DiceKey without orientations
    // } else if (!this.derivationOptionsMutable) {
    //   // Hide hint field.  Hide orientations field
    //   // This application does nto support hints or ignoring orientations
    // } else {
    //   // You may set a hint and remove orientations
    // }

  }

}
