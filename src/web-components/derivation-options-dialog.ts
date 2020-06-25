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
  DiceKeyInHumanReadableForm
} from "../dicekeys/dicekey";
import {
  UsersApprovalAndModificationOfDerivationOptionsParameters,
  UsersApprovedSeedAndDerivationOptions
} from "../api-handler/permission-checked-seed-accessor";
import {
  DiceKeyCanvas,
  removeAllButCornerLettersFromDiceKey
} from "./dicekey-canvas";

export class DerivationOptionsDialog extends HtmlComponent<UsersApprovalAndModificationOfDerivationOptionsParameters> {
  protected messageElementId = this.uniqueNodeId("message");
  protected confirmSendResponseButtonId = this.uniqueNodeId("continue-button");
  protected cancelSendResponseButtonId = this.uniqueNodeId("cancel-button");

  protected hintInputTextFieldId = this.uniqueNodeId("hint-text");
  protected removeOrientationToggleButtonId = this.uniqueNodeId("remove-orientation");
  protected strengtMessageTextId = this.uniqueNodeId("strength-message-text");

  protected closeWindowUponRespondingCheckboxId = this.uniqueNodeId("close-window-on-responding-checkbox");
  protected forgetDiceKeyAfterRespondingId = this.uniqueNodeId("remember-dicekey-after-responding-checkbox");
  protected rememberDiceKeyForDurationId = this.uniqueNodeId("remember-dicekey-after-duration-checkbox");

  public readonly derivationOptions: DerivationOptions;

  private html = `
    <div id=message></div>
    <div>
      <div id="${this.strengtMessageTextId}"></div>
    </div>
    <div>
      <label for="${this.hintInputTextFieldId}">Hint</label>
      <input type="text" id="${this.hintInputTextFieldId}" size="60" />
    </div>
    <div>
      <label for="${this.removeOrientationToggleButtonId}">Remove orientations</label>
      <input type="checkbox" id="${this.removeOrientationToggleButtonId}"/>
    </div>
    <div>
      <label for="${this.rememberDiceKeyForDurationId}">Keep DiceKey in browser for</label>
      <select rememberDiceKeyForDuration="${this.rememberDiceKeyForDurationId}">
      </select>
    </div>
    <div>
      <label for="${this.closeWindowUponRespondingCheckboxId}">Close this tab on continue</label>
      <input type="checkbox" id="${this.closeWindowUponRespondingCheckboxId}"/>
    <div>
    <div>
      <input type="button" id="${this.cancelSendResponseButtonId}" value="Cancel"/>
      <input type="button" id="${this.confirmSendResponseButtonId}" value="Continue"/>
    </div>
`

//  private get messageDiv(){return document.getElementById(ConfirmOperationDialog.messageElementId) as HTMLDivElement;}
  private get continueButton() {return this.getInputField(this.confirmSendResponseButtonId)!; };
  private get cancelButton() {return this.getInputField(this.cancelSendResponseButtonId)!; }
 
  private get hintInputTextField(){ return this.getInputField(this.hintInputTextFieldId)!; }
  private get excludeOrientationToggleButton(){
    return this.getInputField(this.removeOrientationToggleButtonId)!;
  }
  private get strengthMessageText(){
    return this.getField<HTMLDivElement>(this.strengtMessageTextId)!;
  }
  private get closeWindowUponRespondingCheckbox(){
    return this.getInputField(this.closeWindowUponRespondingCheckboxId)!;
  }
  private get closeWindowUponResponding() {
    return this.closeWindowUponRespondingCheckbox.checked;
  }

  private get diceKey(): DiceKey {
    return DiceKey.applyDerivationOptions(this.options.diceKey, this.derivationOptions);
  }

  private get seedString(): DiceKeyInHumanReadableForm {
    return DiceKey.toSeedString( this.options.diceKey, this.derivationOptions );
  }

  private get cornerLetters(): string {
    const diceKey = this.diceKey;
    if (typeof diceKey === "undefined") {
      return "";
    }
    return [0, 4, 24, 20]
      .map( index => diceKey[index].letter )
      .join("");
  }

  private get numberOfCornerLettersInHint() {
    const hintText = this.hintInputTextField.value.replace(this.hintPrefix, "");
    return this.cornerLetters.split("")
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

  private priorDerivationProven = (): boolean =>
    this.proofOfPriorDerivationModule.verify(
      this.seedString, this.derivationOptions
    );

  private getfinalDerivationOptionsJson = (): string => {
    if (!this.derivationOptionsMutable) {
      // We weren't allowed to mutate the derivatio options so leave them unchanged
      return this.options.derivationOptionsJson
    } else {
      return this.proofOfPriorDerivationModule.addToDerivationOptionsJson(this.seedString, this.derivationOptions)
     }

    return "";
  }
 
  public userApprovedEvent = new ComponentEvent<[UsersApprovedSeedAndDerivationOptions]>(this);
  public userCancelledEvent = new ComponentEvent(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    private proofOfPriorDerivationModule: ProofOfPriorDerivationModule,
    options: UsersApprovalAndModificationOfDerivationOptionsParameters,
    private hintPrefix: string = `Use a DiceKey with corner letters: `
  ) {
    super(options);
    this.derivationOptions = DerivationOptions(this.options.derivationOptionsJson);
  }

  private setDiceKeyCanvas = this.replaceableChild<DiceKeyCanvas>();
  renderDiceKey = () => {
    const diceKey = this.derivationOptions.excludeOrientationOfFaces ?
      DiceKey.removeOrientations(this.diceKey) :
      this.diceKey;

      return this.setDiceKeyCanvas(new DiceKeyCanvas({
        diceKey, // removeAllButCornerLettersFromDiceKey(diceKey),
        size: 320
      }));
  }


  render() {
    super.render();

    this.renderDiceKey();

    this.appendHtml(this.html);

    this.continueButton.addEventListener("click", async () => {
      this.userApprovedEvent.send({
        seedString: this.seedString,
        derivationOptionsJson: this.getfinalDerivationOptionsJson()
      });

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
        this.renderDiceKey();
        return true;
      });
      this.hintInputTextField.addEventListener("change", () => {
        this.derivationOptions.seedHint = this.hintInputTextField.value;
        this.strengthMessageText.textContent = this.strengthMessage;
      });
      this.hintInputTextField.addEventListener("keyup", () => {
        this.derivationOptions.seedHint = this.hintInputTextField.value;
        this.strengthMessageText.textContent = this.strengthMessage;
      });
    }

    this.hintInputTextField.value = this.hintPrefix +
        this.cornerLetters.split("").join(", ");
    this.strengthMessageText.textContent = this.strengthMessage;

    if (this.options.command === "getSecret" && this.priorDerivationProven() ) {
      // Note that "You are re-creating a secret you have created before."
    } else if (
      this.options.command.startsWith("get") &&
        this.options.command.endsWith("Key") &&
        this.priorDerivationProven()
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
