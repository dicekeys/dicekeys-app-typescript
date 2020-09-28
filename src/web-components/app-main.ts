import styles from "./app-main.module.css";
import {
  Component, Attributes, Div
} from "../web-component-framework"
import { Exceptions, ApiCalls } from "@dicekeys/dicekeys-api-js";
import {
  ApiRequestContainer
} from "./api-request-handling/api-request-container";
import {
  DiceKeySvgView
} from "./display-dicekey/display-dicekey";
import {
  DisplayWhenNoDiceKeyPresent
} from "./display-when-no-dicekey-present";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  Step,
  EncryptedCrossTabState
} from "../state"
import {
  postMessageApiResponder
} from "../api-handler/handle-post-message-api-request";
import {
  ApiRequestContext
} from "../api-handler/handle-api-request";
import { ScanDiceKey } from "./scanning/scan-dicekey";
import {
  urlApiResponder
} from "../api-handler/handle-url-api-request";
import {
  reportException
} from "./exceptions";


interface BodyOptions extends Attributes {
  appState: EncryptedCrossTabState;
}

export class AppMain extends Component<BodyOptions, HTMLElement> {
  appState: EncryptedCrossTabState;

//  action: PageAction = "home";

  constructor(options: BodyOptions) {
    super(options, document.body);
    this.addClass(styles.AppMain);
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

    if (new URL(window.location.toString()).searchParams.get(ApiCalls.RequestCommandParameterNames.command)) {      
      urlApiResponder(this.getUsersApprovalOfApiCommand)(window.location.toString())
    }    

  }

  readonly handleApiRequestReceivedViaPostMessage: ReturnType<typeof postMessageApiResponder>;

  handleMessageEvent (messageEvent: MessageEvent) {
    this.handleApiMessageEvent(messageEvent);
  }

  handleApiMessageEvent = async (messageEvent: MessageEvent) => {
    this.handleApiRequestReceivedViaPostMessage(messageEvent);
  };


  loadDiceKey = async (): Promise<DiceKey> => {
    const diceKey = EncryptedCrossTabState.instance?.diceKey.value;
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

  async render() {
    super.render();
    const diceKey = this.appState.diceKey.value;
    if (Step.getUsersConsent.isInProgress) {
      // If we're in the middle of getting the user's consent for an operation,
      // Render the ApiRequestContainer
      this.append(
        new ApiRequestContainer(
          {requestContext: Step.getUsersConsent.options, onExceptionEvent: reportException}
        ).with ( apiRequest => {
          apiRequest.userApprovedEvent.on( Step.getUsersConsent.complete )
          apiRequest.userCancelledEvent.on( () => Step.getUsersConsent.cancel(new Exceptions.UserDeclinedToAuthorizeOperation("User cancelled")) )
        })
      )
      Step.getUsersConsent.promise?.finally( this.renderSoon );
    } else if (Step.loadDiceKey.isInProgress) {
      // When we're in the process of loading/scanning a DiceKey,
      // show the component for scanning it.
      this.append(
        Div({class: "request-container"},
          new ScanDiceKey({host: "", onExceptionEvent: reportException}).with( readDiceKey => { 
          readDiceKey.diceKeyLoadedEvent.on( Step.loadDiceKey.complete );
        })
      ));
      Step.loadDiceKey.promise?.finally( () => this.renderSoon() );

    } else if (diceKey) {
      // A DiceKey is present and the user has options for what to do with it.
      this.append(new DiceKeySvgView({diceKey}).with( dicekeySvg => {
        dicekeySvg.forgetEvent.on( () => this.renderSoon() );
      }));
    } else {
      // There is no DiceKey present and the user has the option to start scanning one
      // or to create a random one
      this.append(new DisplayWhenNoDiceKeyPresent().with( homeComponent  => {
        homeComponent.loadDiceKeyButtonClicked.on( () => {
          this.loadDiceKey();
        });
        homeComponent.createRandomDiceKeyButtonClicked.on( () => {
          EncryptedCrossTabState.instance?.diceKey.set(DiceKey.fromRandom());
          this.renderSoon();
        });
      }));
    }
  }

}
