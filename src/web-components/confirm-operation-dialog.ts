import {
//  Exceptions,
  RequestForUsersConsent
} from "@dicekeys/dicekeys-api-js";
import {
  HtmlComponent
} from "./html-component";
import {
  ComponentEvent
} from "./component-event"

interface ConfirmOperationDialogOptions {
  requestForUsersConsent?: RequestForUsersConsent,
  origin?: string
};

export class ConfirmOperationDialog extends HtmlComponent<ConfirmOperationDialogOptions> {
  static messageElementId = "message";
  static allowButtonId = "allow-button";
  static declineButtonId = "deny-button";

  static hintInputTextFieldId = "hint-text";
  static removeOrientationToggleId = "remove-orientation";
  static strengtMessageTextId = "strength-message-text";
  static closeWindowUponRespondingCheckboxId = "close-window-on-responding-checkbox";
  static forgetDiceKeyAfterRespondingId = "remember-dicekey-after-responding-checkbox";
  static rememberDiceKeyForDurationID =  "remember-dicekey-after-duration-checkbox";


  static html = `
    <div id=message></div>
    <input type="button" id="${ConfirmOperationDialog.allowButtonId}"/>
    <input type="button" id="${ConfirmOperationDialog.declineButtonId}"/>
`
  
//  private get messageDiv(){return document.getElementById(ConfirmOperationDialog.messageElementId) as HTMLDivElement;}
  private get allowButton(){return document.getElementById(ConfirmOperationDialog.allowButtonId) as HTMLInputElement;}
  private get declineButton(){return document.getElementById(ConfirmOperationDialog.declineButtonId) as HTMLInputElement;}
  public allowChosenEvent = new ComponentEvent(this);
  public declineChosenEvent = new ComponentEvent(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: Partial<ConfirmOperationDialogOptions> = {},
    parentComponent?: HtmlComponent
  ) {
    super(options, parentComponent);
    this.addHtml(ConfirmOperationDialog.html);

    this.allowButton.addEventListener("click", () => {
      this.allowChosenEvent.send();
      this.remove();
    });
    this.declineButton.addEventListener("click", () => {
      this.declineChosenEvent.send();
      this.remove();
    });

    return this;
  }

}
