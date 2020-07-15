// import {
// //  Exceptions,
//   RequestForUsersConsent
// } from "@dicekeys/dicekeys-api-js";
// import {
//   HtmlComponent,
//   Attributes
// } from "./html-component";
// import {
//   ComponentEvent
// } from "./component-event"

// interface ConfirmationDialogOptions extends Attributes {
//   requestForUsersConsent?: RequestForUsersConsent,
//   origin?: string
// };

// export class ConfirmationDialog extends HtmlComponent<ConfirmationDialogOptions> {
//   static messageElementId = "message";
//   static allowButtonId = "allow-button";
//   static declineButtonId = "deny-button";
//   static html = `
//     <div id=message></div>
//     <input type="button" id="${ConfirmationDialog.allowButtonId}"/>
//     <input type="button" id="${ConfirmationDialog.declineButtonId}"/>
// `
  
//   private get messageDiv(){return document.getElementById(ConfirmationDialog.messageElementId) as HTMLDivElement;}
//   private get allowButton(){return document.getElementById(ConfirmationDialog.allowButtonId) as HTMLInputElement;}
//   private get declineButton(){return document.getElementById(ConfirmationDialog.declineButtonId) as HTMLInputElement;}
//   public allowChosenEvent = new ComponentEvent(this);
//   public declineChosenEvent = new ComponentEvent(this);

//   /**
//    * The code supporting the dmeo page cannot until the WebAssembly module for the image
//    * processor has been loaded. Pass the module to wire up the page with this class.
//    * @param module The web assembly module that implements the DiceKey image processing.
//    */
//   constructor(
//     options: Partial<ConfirmationDialogOptions> = {}
//   ) {
//     super(options);
//     this.appendHtml(ConfirmationDialog.html);

//     const {requestForUsersConsent} = this.options;
//     if (!requestForUsersConsent) {
//       return this; // Must have a request for user's consent in either constructor or attached
//     }
//     const {question, actionButtonLabels} = requestForUsersConsent;
//     this.messageDiv.innerText = question;
//     this.allowButton.value = actionButtonLabels.allow;
//     this.declineButton.value = actionButtonLabels.decline;

//     this.allowButton.addEventListener("click", () => {
//       this.allowChosenEvent.send();
//       this.remove();
//     });
//     this.declineButton.addEventListener("click", () => {
//       this.declineChosenEvent.send();
//       this.remove();
//     });

//     return this;
//   }

// }
