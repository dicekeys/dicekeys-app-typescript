import ReactDOM from "react-dom";
import * as React from "react";
import {AppTopLevelRoutingView} from "./web-components/AppTopLevelRoutingView";
import { ErrorHandler } from "~web-components/ErrorHandler";
import { ErrorState } from "~web-components/ErrorState";
// import { postMessageApiResponder } from "~api-handler/handle-post-message-api-request";
// import {
//   urlApiResponder
// } from "../api-handler/handle-url-api-request";


const ApplicationErrorState = new ErrorState();

// // const handleApiRequestReceivedViaPostMessage = postMessageApiResponder(this.getUsersApprovalOfApiCommand)
// const { searchParams } = new URL(window.location.toString())
// if (searchParams.get(ApiCalls.RequestCommandParameterNames.command)) {      
//   urlApiResponder(getUsersApprovalOfApiCommand)(window.location.toString())
// }
// // window.addEventListener("message", messageEvent => handleMessageEvent(messageEvent) );

window.addEventListener('load', () => {
  ReactDOM.render((
    <ErrorHandler errorState={ApplicationErrorState}>
      <AppTopLevelRoutingView />
    </ErrorHandler>
  ), document.getElementById("app-container"));
});


// Let the parent know we're ready for messages. // FIXME document in API
if (window.opener) {
  // Using origin "*" is dangerous, but we allow it only to let the window
  // that opened the app know that the window it opened had loaded.
  window.opener?.postMessage("ready", "*");
}
