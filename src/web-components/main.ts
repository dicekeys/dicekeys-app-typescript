import {
  HtmlComponent
} from "./html-component"

import {
  UsersConsentResponse, RequestForUsersConsent
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




// var loadDiceKeyPromise: Promise<DiceKey> | undefined;
// const loadDiceKeyAsync = async (): Promise<DiceKey> => {
//   var diceKey = (await DiceKeyAppState.instancePromise).diceKey;
//   if (diceKey) {
//     return diceKey;
//   }
//   if (!loadDiceKeyPromise) {
//     loadDiceKeyPromise = new Promise( (resolve, reject) => {
//       new ReadDiceKey({parentElement: document.body}).attach()
//         .diceKeyLoadedEvent.on( (diceKey) => {
//             DiceKeyAppState.instance!.diceKey = diceKey;
//             resolve(diceKey);
//         })
//         .userCancelledEvent.on( () => reject( 
//           Exceptions.UserCancelledLoadingDiceKey.create()
//         ))
//     });
//     loadDiceKeyPromise.finally( () => { loadDiceKeyPromise = undefined; } )
//     HomeComponent.instance?.detach();
//   }
//   return await loadDiceKeyPromise;
// }

//type PageAction = "home" | "scan" | "display" | "confirm";

interface BodyOptions {
  appState: DiceKeyAppState;
}

export class AppMain extends HtmlComponent<BodyOptions, HTMLElement> {
  appState: DiceKeyAppState;

//  action: PageAction = "home";

  constructor(options: BodyOptions) {
    super(options, undefined, document.body);
    const {appState} = options;
    this.appState = appState;
//    this.action = action ?? "home";

    
    // Add a message listener
    const handleApiMessageEvent = async (messageEvent: MessageEvent) => {
      const serverApi = new PostMessagePermissionCheckedMarshalledCommands(
      messageEvent,
      this.loadDiceKey,
      this.requestUsersConsent
    );
    if (serverApi.isCommand()) {
      await serverApi.execute();
      const windowName = messageEvent?.data?.windowName;
      // Try to send focus back to calling window.
      if (typeof windowName === "string") {
        const windowOpener = window.opener;// window.open("", windowName);
        windowOpener?.focus();
      }
      // FIXME -- formalize rules for timeout, when to keep window open
      setTimeout( () => window.close(), 2000);
        }
    };
    window.addEventListener("message", handleApiMessageEvent );
    // Let the parent know we're ready for messages. // FIXME document in API
    if (window.opener) {
    // Using origin "*" is dangerous, but we allow it only to let the window
    // that opened the app know that the window it opened had loaded.
    window.opener?.postMessage("ready", "*");
    }
  }

  loadDiceKey = (): Promise<DiceKey> => {
    this.renderSoon(); 
    return Step.loadDiceKey.start();
  }

  requestUsersConsent = async (
    requestForUsersConsent: RequestForUsersConsent
  ) => {
    this.renderSoon();
    return Step.getUsersConsent.start(requestForUsersConsent);
  }

  render() {
    super.render();
    const diceKey = this.appState.diceKey;
    if (diceKey) {
      const displayCanvas = this.addChild(new DisplayDiceKeyCanvas({diceKey}));
      displayCanvas.forgetEvent.on( () => this.renderSoon() );

    } else if (Step.getUsersConsent.isInProgress) {
      
      const confirmationDialog = this.addChild(
        new ConfirmationDialog({requestForUsersConsent: Step.getUsersConsent.options}, this)
      );
      confirmationDialog
        .allowChosenEvent.on( () => Step.getUsersConsent.complete(UsersConsentResponse.Allow) )
        .declineChosenEvent.on( () => Step.getUsersConsent.cancel(UsersConsentResponse.Deny) )
      Step.getUsersConsent.promise?.finally( () => this.renderSoon() );

    } else if (Step.loadDiceKey.isInProgress) {
      const readDiceKey = this.addChild(new ReadDiceKey(this));
      readDiceKey.diceKeyLoadedEvent.on( Step.loadDiceKey.complete );
      readDiceKey.userCancelledEvent.on( () => Step.loadDiceKey.cancel(
        new Exceptions.UserCancelledLoadingDiceKey()
      ));
      Step.loadDiceKey.promise?.finally( () => this.renderSoon() );

    } else {
      const homeComponent = this.addChild(new HomeComponent({}, this));
      homeComponent.loadDiceKeyButtonClicked.on( () => {
        this.loadDiceKey();
      });

    }
  }

}
