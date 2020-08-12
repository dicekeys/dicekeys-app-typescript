import {
  Component, Attributes, Div
} from "../web-component-framework"

import { Exceptions, ApiStrings } from "@dicekeys/dicekeys-api-js";
import {
  ApiRequestContainer
} from "./api-request-container";
import {
  DiceKeySvgView
} from "./display-dicekey-svg";
import {
  HomeComponent
} from "./home-component";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  Step,
  DiceKeyAppState
} from "../state"
import {
  postMessageApiResponder
} from "../api-handler/handle-post-message-api-request";
import {
  ApiRequestContext
} from "../api-handler/handle-api-request";
import { ScanDiceKey } from "./scan-dicekey";
import {
  urlApiResponder
} from "../api-handler/handle-url-api-request";


interface BodyOptions extends Attributes {
  appState: DiceKeyAppState;
}

export class AppMain extends Component<BodyOptions, HTMLElement> {
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

    if (new URL(window.location.toString()).searchParams.get(ApiStrings.Inputs.COMMON.command)) {      
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

  async render() {
    super.render();
    const diceKey = this.appState.diceKey.value;
    if (Step.getUsersConsent.isInProgress) {
      this.append(
        new ApiRequestContainer(
          {requestContext: Step.getUsersConsent.options}
        ).with ( apiRequest => {
          apiRequest.userApprovedEvent.on( Step.getUsersConsent.complete )
          apiRequest.userCancelledEvent.on( () => Step.getUsersConsent.cancel(new Exceptions.UserDeclinedToAuthorizeOperation("User cancelled")) )
        })
      )
      Step.getUsersConsent.promise?.finally( this.renderSoon );
    } else if (Step.loadDiceKey.isInProgress) {
      this.append(
        Div({class: "request-container"},
          new ScanDiceKey({host: ""}).with( readDiceKey => { 
          readDiceKey.diceKeyLoadedEvent.on( Step.loadDiceKey.complete );
        })
      ));
      Step.loadDiceKey.promise?.finally( () => this.renderSoon() );

    } else if (diceKey) {
      this.append(new DiceKeySvgView({diceKey}).with( dicekeySvg => {
        dicekeySvg.forgetEvent.on( () => this.renderSoon() );
      }));
    } else {
      this.append(new HomeComponent().with( homeComponent  => {
        homeComponent.loadDiceKeyButtonClicked.on( () => {
          this.loadDiceKey();
        });
        homeComponent.createRandomDiceKeyButtonClicked.on( () => {
          DiceKeyAppState.instance?.diceKey.set(DiceKey.fromRandom());
          this.renderSoon();
        });
      }));
    }
  }

}
