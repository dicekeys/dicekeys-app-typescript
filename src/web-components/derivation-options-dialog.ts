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
  ProofOfPriorDerivation as ProofOfPriorDerivationModule
} from "../api-handler/mutate-derivation-options"
import { DiceKey, DiceKeyInHumanReadableForm } from "../dicekeys/dicekey";
import {
  UsersApprovalAndModificationOfDerivationOptionsParameters,
  UsersApprovedSeedAndDerivationOptions
} from "../api-handler/permission-checked-seed-accessor";
import { DiceKeyCanvas } from "./dicekey-canvas";

export class DerivationOptionsDialog extends HtmlComponent<UsersApprovalAndModificationOfDerivationOptionsParameters> {
  static messageElementId = "message";
  static confirmSendResponseButtonId = "continue-button";
  static cancelSendResponseButtonId = "cancel-button";

  static hintInputTextFieldId = "hint-text";
  static removeOrientationToggleButtonId = "remove-orientation";
  static strengtMessageTextId = "strength-message-text";

  static closeWindowUponRespondingCheckboxId = "close-window-on-responding-checkbox";
  static forgetDiceKeyAfterRespondingId = "remember-dicekey-after-responding-checkbox";
  static rememberDiceKeyForDurationId =  "remember-dicekey-after-duration-checkbox";

  public readonly derivationOptions: DerivationOptions;

  static html = `
    <div id=message></div>
    <div>
      <div id="${DerivationOptionsDialog.strengtMessageTextId}"></div>
    </div>
    <div>
      <label for="${DerivationOptionsDialog.hintInputTextFieldId}">Hint</label>
      <input type="text" id="${DerivationOptionsDialog.hintInputTextFieldId}" size="60" />
    </div>
    <div>
      <label for="${DerivationOptionsDialog.removeOrientationToggleButtonId}">Remove orientations</label>
      <input type="checkbox" id="${DerivationOptionsDialog.removeOrientationToggleButtonId}"/>
    </div>
    <div>
      <label for="${DerivationOptionsDialog.rememberDiceKeyForDurationId}">Keep DiceKey in browser for</label>
      <select rememberDiceKeyForDuration="${DerivationOptionsDialog.rememberDiceKeyForDurationId}">
      </select>
    </div>
    <div>
      <label for="${DerivationOptionsDialog.closeWindowUponRespondingCheckboxId}">Close this tab on continue</label>
      <input type="checkbox" id="${DerivationOptionsDialog.closeWindowUponRespondingCheckboxId}"/>
    <div>
    <div>
      <input type="button" id="${DerivationOptionsDialog.cancelSendResponseButtonId}" value="Cancel"/>
      <input type="button" id="${DerivationOptionsDialog.confirmSendResponseButtonId}" value="Continue"/>
    </div>
`

//  private get messageDiv(){return document.getElementById(ConfirmOperationDialog.messageElementId) as HTMLDivElement;}
  private get continueButton() {return this.getInputField(DerivationOptionsDialog.confirmSendResponseButtonId)!; };
  private get cancelButton() {return this.getInputField(DerivationOptionsDialog.cancelSendResponseButtonId)!; }
 
  private get hintInputTextField(){ return this.getInputField(DerivationOptionsDialog.hintInputTextFieldId)!; }
  private get excludeOrientationToggleButton(){
    return this.getInputField(DerivationOptionsDialog.removeOrientationToggleButtonId)!;
  }
  private get strengthMessageText(){
    return this.getField<HTMLDivElement>(DerivationOptionsDialog.strengtMessageTextId)!;
  }
  private get closeWindowUponRespondingCheckbox(){
    return this.getInputField(DerivationOptionsDialog.closeWindowUponRespondingCheckboxId)!;
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
    parentComponent?: HtmlComponent,
    private hintPrefix: string = `Use a DiceKey with corner letters: `
  ) {
    super(options, parentComponent);
    this.derivationOptions = DerivationOptions(this.options.derivationOptionsJson);
  }


  render() {
    super.render();

    this.addChild( new DiceKeyCanvas({diceKey: this.diceKey, size: 320 }) )

    this.addHtml(DerivationOptionsDialog.html);

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
