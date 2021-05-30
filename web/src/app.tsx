import ReactDOM from "react-dom";
import * as React from "react";
import {WindowTopLevelView} from "./views/WindowTopLevelView";
import { ErrorHandler } from "./views/ErrorHandler";
import { ErrorState } from "./views/ErrorState";

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
      <WindowTopLevelView />
    </ErrorHandler>
  ), document.getElementById("app_container"));
});


// Let the parent know we're ready for messages. // FIXME document in API
if (window.opener) {
  // Using origin "*" is dangerous, but we allow it only to let the window
  // that opened the app know that the window it opened had loaded.
  window.opener?.postMessage("ready", "*");
}
