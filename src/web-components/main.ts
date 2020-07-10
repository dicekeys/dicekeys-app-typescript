import {
  HtmlComponent, Attributes
} from "./html-component"

import {
  RequestForUsersConsent,
  UsersConsentResponse,
} from "@dicekeys/dicekeys-api-js";
// import {
//   ComponentEvent
// } from "./component-event";
import {
  DisplayDiceKeyCanvas
} from "./display-dicekey-canvas";
import {
  HomeComponent
} from "./home-component";
import {
  ConfirmationDialog
} from "./confirmation-dialog";
import {
  ApiRequest
} from "./api-request";
import {
  Exceptions
} from "@dicekeys/dicekeys-api-js"
import {
  ReadDiceKey
} from "./read-dicekey";
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
  PostMessagePermissionCheckedMarshalledCommands
} from "../api-handler/post-message-permission-checked-marshalled-commands";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { RequestForUsersConsentFn } from "../api-handler/api-permission-checks";
import {
  GetUsersApprovalOfApiCommand, ApiCommandParameters
} from "../api-handler/permission-checked-seed-accessor";
import { ProofOfPriorDerivationModule } from "../api-handler/mutate-derivation-options";


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
  }

  handleMessageEvent (messageEvent: MessageEvent) {
    this.handleApiMessageEvent(messageEvent);
  }

  handleApiMessageEvent = async (messageEvent: MessageEvent) => {
    const serverApi = new PostMessagePermissionCheckedMarshalledCommands(
      messageEvent,
      await SeededCryptoModulePromise,
      this.requestUsersConsent,
      this.getUsersApprovalOfApiCommand,
    );
    if (serverApi.isCommand()) {
      await serverApi.execute();
      const windowName = messageEvent?.data?.windowName;
      // Try to send focus back to calling window.
      if (typeof windowName === "string") {
        const windowOpener = window.opener;// window.open("", windowName);
        windowOpener?.focus();
      }
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

  requestUsersConsent: RequestForUsersConsentFn = (
    requestForUsersConsent: RequestForUsersConsent
  ) => {
    this.renderSoon();
    return Step.getUsersConsent.start(requestForUsersConsent);
  }

  getUsersApprovalOfApiCommand: GetUsersApprovalOfApiCommand = (
    parameters: ApiCommandParameters
  ) => {
    return Step.apiCommand.start(parameters);
  }

  async render() {
    super.render();
    const diceKey = this.appState.diceKey.value;
    if (Step.getUsersConsent.isInProgress) {
      
      const confirmationDialog = this.appendChild(
        new ConfirmationDialog({requestForUsersConsent: Step.getUsersConsent.options})
      );
      confirmationDialog
        .allowChosenEvent.on( () => Step.getUsersConsent.complete(UsersConsentResponse.Allow) )
        .declineChosenEvent.on( () => Step.getUsersConsent.cancel(UsersConsentResponse.Deny) )
      Step.getUsersConsent.promise?.finally( () => this.renderSoon() );

    } else if (Step.apiCommand.isInProgress) {      
      this.append(
        new ApiRequest(
          await ProofOfPriorDerivationModule.instancePromise,
          Step.apiCommand.options
        ).with ( apiRequest => {
          apiRequest.userApprovedEvent.on( Step.apiCommand.complete )
          apiRequest.userCancelledEvent.on( Step.apiCommand.cancel )    
        })
      )
      Step.apiCommand.promise?.finally( this.renderSoon );
    } else if (Step.loadDiceKey.isInProgress) {
      this.append(new ReadDiceKey().with( readDiceKey => { 
        readDiceKey.diceKeyLoadedEvent.on( Step.loadDiceKey.complete );
        readDiceKey.userCancelledEvent.on( () => Step.loadDiceKey.cancel(
          new Exceptions.UserCancelledLoadingDiceKey()
        ));
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
