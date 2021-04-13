// import styles from "./app-main.module.css";
// import {
//   Component, Attributes, Div
// } from "../web-component-framework"
// import { Exceptions, ApiCalls } from "@dicekeys/dicekeys-api-js";
// import {
//   ApiRequestContainer
// } from "./api-request-handling/api-request-container";
// import {
//   DiceKeySvgView
// } from "./selected-dicekey/display-dicekey";
// import {
//   HomeScreenForNoDiceKeyLoaded
// } from "./home-screen-no-dicekey-loaded";
// import {
//   DiceKey
// } from "../dicekeys/dicekey";
// import {
//   Step,
//   EncryptedCrossTabState
// } from "../state"
// import {
//   postMessageApiResponder
// } from "../api-handler/QueuedPostMessageApiRequest";
// import {
//   ApiRequestContext
// } from "../api-handler/QueuedApiRequest";
// import {
//   urlApiResponder
// } from "../api-handler/QueuedUrlApiRequest";
// import {
//   reportException
// } from "./exceptions";
// import { LoadAndStoreDiceKey } from "./load-and-store-dicekey";
// import { CameraPermissionsRequiredNotification } from "./reading-dicekeys/camera-permissions-required-notice";



// interface BodyOptions extends Attributes {
//   appState: EncryptedCrossTabState;
// }

// export class AppMain extends Component<BodyOptions> {

//   constructor(options: BodyOptions) {
//     super(options, document.body);
//     this.addClass(styles.AppMain);

//     window.addEventListener("message", messageEvent => this.handleMessageEvent(messageEvent) );
//     // Let the parent know we're ready for messages. // FIXME document in API
//     if (window.opener) {
//       // Using origin "*" is dangerous, but we allow it only to let the window
//       // that opened the app know that the window it opened had loaded.
//       window.opener?.postMessage("ready", "*");
//     }

//     this.handleApiRequestReceivedViaPostMessage = postMessageApiResponder(this.getUsersApprovalOfApiCommand)

//     if (new URL(window.location.toString()).searchParams.get(ApiCalls.RequestCommandParameterNames.command)) {      
//       urlApiResponder(this.getUsersApprovalOfApiCommand)(window.location.toString())
//     }


//   }

//   readonly handleApiRequestReceivedViaPostMessage: ReturnType<typeof postMessageApiResponder>;

//   handleMessageEvent (messageEvent: MessageEvent) {
//     this.handleApiMessageEvent(messageEvent);
//   }

//   handleApiMessageEvent = async (messageEvent: MessageEvent) => {
//     this.handleApiRequestReceivedViaPostMessage(messageEvent);
//   };


//   loadDiceKey = async (): Promise<DiceKey> => {
//     const appState = await EncryptedCrossTabState.instancePromise;
//     this.renderSoon();
//     var diceKey = appState.diceKey ?? await Step.loadDiceKey.start();
//     // appState.diceKey = diceKey;
//     // appState.diceKeyState?.hasBeenReadWithoutError.set(true);
//     return diceKey!;
//   }

//   enterDiceKey = async (): Promise<DiceKey> => {
//     this.renderSoon(); 
//     const diceKey = await Step.enterDiceKey.start();
//     this.renderSoon(); 
//     // const appState = await EncryptedCrossTabState.instancePromise;
//     // appState.diceKey = diceKey;
//     return diceKey!;
//   }

//   getUsersApprovalOfApiCommand = (
//     requestContext: ApiRequestContext
//   ) => {
//     this.renderSoon();
//     return Step.getUsersConsent.start(requestContext);
//   }

//   async render() {
//     const {appState} = this.options;
//     super.render();
//     this.append(
//       new CameraPermissionsRequiredNotification()
//     );

//     const diceKey = appState.diceKey;
//     if (Step.getUsersConsent.isInProgress) {
//       // If we're in the middle of getting the user's consent for an operation,
//       // Render the ApiRequestContainer
//       this.append(
//         new ApiRequestContainer(
//           {appState, requestContext: Step.getUsersConsent.options, onExceptionEvent: reportException}
//         ).with ( apiRequest => {
//           apiRequest.userApprovedEvent.on( Step.getUsersConsent.complete )
//           apiRequest.userCancelledEvent.on( () => Step.getUsersConsent.cancel(new Exceptions.UserDeclinedToAuthorizeOperation("User cancelled")) )
//         })
//       )
//       Step.getUsersConsent.promise?.finally( this.renderSoon );
//     } else if (Step.enterDiceKey.isInProgress) {
//       // When we're in the process of loading/scanning a DiceKey,
//       // show the component for scanning it.
//       this.append(
//         Div({class: "request-container"},
//           new LoadAndStoreDiceKey({onExceptionEvent: reportException, mode: "manual"}).with( enterDiceKey => { 
//           enterDiceKey.completedEvent.on( (diceKey) => Step.enterDiceKey.complete(diceKey) );
//           enterDiceKey.cancelledEvent.on( Step.enterDiceKey.cancel );
//         })
//       ));
//       Step.enterDiceKey.promise?.finally( () => this.renderSoon() );

//     }  else if (Step.loadDiceKey.isInProgress) {
//       // When we're in the process of loading/scanning a DiceKey,
//       // show the component for scanning it.
//       this.append(
//         Div({class: "request-container"},
//           new LoadAndStoreDiceKey({onExceptionEvent: reportException, mode: "camera"}).with( readDiceKey => { 
//           readDiceKey.completedEvent.on( (diceKey) => Step.loadDiceKey.complete(diceKey) );
//           readDiceKey.cancelledEvent.on( Step.loadDiceKey.cancel );
//         })
//       ));
//       Step.loadDiceKey.promise?.finally( () => this.renderSoon() );

//     } else if (diceKey) {
//       // A DiceKey is present and the user has options for what to do with it.
//       this.append(new DiceKeySvgView({diceKey}).with( dicekeySvg => {
//         dicekeySvg.forgetEvent.on( () => this.renderSoon() );
//       }));
//     } else {
//       // There is no DiceKey present and the user has the option to start scanning one
//       // or to create a random one
//       this.append(new HomeScreenForNoDiceKeyLoaded({}).with( homeComponent  => {
//         homeComponent.loadDiceKeyButtonClicked.on( () => {
//           this.loadDiceKey();
//         });
//         homeComponent.typeDiceKeyButtonClicked.on( () => {
//           this.enterDiceKey();
//         });
//         homeComponent.createRandomDiceKeyButtonClicked.on( () => {
//           EncryptedCrossTabState.instance!.diceKey = DiceKey.fromRandom();
//           this.renderSoon();
//         });
//       }));
//     }
//   }

// }
