import ReactDOM from "react-dom";
import * as React from "react";
import {WindowTopLevelView} from "./views/WindowTopLevelView";
import { ErrorHandler } from "./views/ErrorHandler";
import { ErrorState } from "./views/ErrorState";
import { DiceKeyMemoryStore } from "./state";
import { isElectron } from "./utilities/is-electron";
import { QueuedUrlApiRequest } from "./api-handler";
import { ApiCalls } from "@dicekeys/dicekeys-api-js";
import { ApiRequestsReceivedState } from "./state/ApiRequestsReceivedState";

const ApplicationErrorState = new ErrorState();

/**
 * For web-based apps, scan the URL on page load
 */
if (!isElectron()) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has(ApiCalls.RequestMetadataParameterNames.command)) {
      const request = new QueuedUrlApiRequest(new URL(window.location.href));
      // If we've reached this point, there is a valid API request that needs to be handled.
      // Add it to the queue.
      ApiRequestsReceivedState.enqueueApiRequestReceived(request);
    }
  } catch {
    // Not a valid request.  Carry on.

    // FUTURE -- throw error if search param had command but it was an invalid command.
  }
}

// On macOS, listen for deep links via https://www.electronjs.org/docs/api/app#event-open-url-macos
// See https://shipshape.io/blog/launch-electron-app-from-browser-custom-protocol/
// app.on('open-url', function (event, url) {
//   event.preventDefault();
//   deeplinkingUrl = url;
// });

window.addEventListener('load', () => {
  DiceKeyMemoryStore.onReady( () => {
    ReactDOM.render((
      <ErrorHandler errorState={ApplicationErrorState}>
        <WindowTopLevelView />
      </ErrorHandler>
    ), document.getElementById("app_container"));
  });
});


// Let the parent know we're ready for messages. // FIXME document in API
if (window.opener) {
  // Using origin "*" is dangerous, but we allow it only to let the window
  // that opened the app know that the window it opened had loaded.
  window.opener?.postMessage("ready", "*");
}
