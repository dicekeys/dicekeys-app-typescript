import {
  HtmlComponent, Attributes
} from "./html-component"

import {
  // RequestForUsersConsent,
  // UsersConsentResponse,
} from "@dicekeys/dicekeys-api-js";
// import {
//   ComponentEvent
// } from "./component-event";
import {
  ApiRequestContainer
} from "./api-request-container";
import {
  DisplayDiceKeyCanvas
} from "./display-dicekey-canvas";
import {
  HomeComponent
} from "./home-component";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey"
import {
  Step
} from "../state"
import {
  postMessageApiResponder
} from "../api-handler/handle-post-message-api-request";
import {
  ApiRequestContext
} from "../api-handler/handle-api-request";
import { ScanDiceKey } from "./scan-dicekey";


interface BodyOptions extends Attributes {
  appState: DiceKeyAppState;
}

export class AppMain extends HtmlComponent<BodyOptions, HTMLElement> {
  appState: DiceKeyAppState;

//  action: PageAction = "home";

  constructor(options: BodyOptions) {
    super(options, document.body);
    const {appState} = options;
    this.appState = appState;
    
    window.addEventListener("message", messageEvent => this.handleMessageEvent(messageEvent) );
    // Let the parent know we're ready for messages. // FIXME document in API
    if (window.opener) {
      // Using origin "*" is dangerous, but we allow it only to let the window
      // that opened the app know that the window it opened had loaded.
      window.opener?.postMessage("ready", "*");
    }

    this.handleApiRequestReceivedViaPostMessage = postMessageApiResponder(this.getUsersApprovalOfApiCommand)
  }

  readonly handleApiRequestReceivedViaPostMessage: ReturnType<typeof postMessageApiResponder>;

  handleMessageEvent (messageEvent: MessageEvent) {
    this.handleApiMessageEvent(messageEvent);
  }

  handleApiMessageEvent = async (messageEvent: MessageEvent) => {
    try {
      await this.handleApiRequestReceivedViaPostMessage(messageEvent);
    } finally {
      // Close this window shortly after request completion
      // setTimeout( () => {
      //   const windowOpener = window.opener;// window.open("", windowName);
      //   windowOpener?.focus();
      //   window.close()
      // }, 250 );
    }
  };


  loadDiceKey = async (): Promise<DiceKey> => {
    const diceKey = DiceKeyAppState.instance?.diceKey.value;
    if (diceKey) {
      return diceKey;
    }
    this.renderSoon(); 
    return await Step.loadDiceKey.start();
  }

  getUsersApprovalOfApiCommand = (
    requestContext: ApiRequestContext
  ) => {
    this.renderSoon();
    return Step.getUsersConsent.start(requestContext);
  }

  // getUsersApprovalOfApiCommand: GetUsersApprovalOfApiCommand = (
  //   parameters: ApiCommandParameters
  // ) => {
  //   return Step.apiCommand.start(parameters);
  // }

  async render() {
    super.render();
    const diceKey = this.appState.diceKey.value;
    if (Step.getUsersConsent.isInProgress) {
      this.append(
        new ApiRequestContainer(
          {requestContext: Step.getUsersConsent.options}
        ).with ( apiRequest => {
          apiRequest.userApprovedEvent.on( Step.getUsersConsent.complete )
          apiRequest.userCancelledEvent.on( Step.getUsersConsent.cancel )    
        })
      )
      Step.getUsersConsent.promise?.finally( this.renderSoon );
    } else if (Step.loadDiceKey.isInProgress) {
      this.append(new ScanDiceKey({host: ""}).with( readDiceKey => { 
        readDiceKey.diceKeyLoadedEvent.on( Step.loadDiceKey.complete );
      }));
      Step.loadDiceKey.promise?.finally( () => this.renderSoon() );

    } else if (diceKey) {
      this.append(new DisplayDiceKeyCanvas({diceKey}).with( displayCanvas => {
        displayCanvas.forgetEvent.on( () => this.renderSoon() );
      }));
    } else {
      this.append(new HomeComponent().with( homeComponent  => 
        homeComponent.loadDiceKeyButtonClicked.on( () => {
          this.loadDiceKey();
      })));
    }
  }

}
