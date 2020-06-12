import {
//  Exceptions,
  RequestForUsersConsent
} from "@dicekeys/dicekeys-api-js";
import {
  HtmlComponent,
  HtmlComponentConstructorOptions,
  HtmlComponentOptions,
  ComponentEvent
} from "./html-component";


export class ConfirmationDialog extends HtmlComponent {
  static messageElementId = "message";
  static allowButtonId = "allow-button";
  static declineButtonId = "deny-button";
  static html = `
    <div id=message></div>
    <input type="button" id="${ConfirmationDialog.allowButtonId}"/>
    <input type="button" id="${ConfirmationDialog.declineButtonId}"/>
`
  
  private get messageDiv(){return document.getElementById(ConfirmationDialog.messageElementId) as HTMLDivElement;}
  private get allowButton(){return document.getElementById(ConfirmationDialog.allowButtonId) as HTMLInputElement;}
  private get declineButton(){return document.getElementById(ConfirmationDialog.declineButtonId) as HTMLInputElement;}
  public allowChosenEvent = new ComponentEvent(this);
  public declineChosenEvent = new ComponentEvent(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: HtmlComponentConstructorOptions = {}
  ) {
    super({
      ...options,
      html: ConfirmationDialog.html
    });
  }

  attach(options: HtmlComponentOptions & {
    requestForUsersConsent: RequestForUsersConsent,
    origin?: string
  }) {
    super.attach(options);
    
    const {question, actionButtonLabels} = options.requestForUsersConsent;
    this.messageDiv.innerText = question;
    this.allowButton.value = actionButtonLabels.allow;
    this.declineButton.value = actionButtonLabels.decline;

    this.allowButton.addEventListener("click", () => {
      this.allowChosenEvent.send();
      this.detach();
    });
    this.declineButton.addEventListener("click", () => {
      this.declineChosenEvent.send();
      this.detach();
    });

    return this;
  }

}
