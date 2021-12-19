import ReactDOM from "react-dom";
import * as React from "react";
import {WindowTopLevelView} from "./views/WindowTopLevelView";
import { ErrorHandler } from "./views/ErrorHandler";
import { ErrorState } from "./views/ErrorState";
import { DiceKeyMemoryStore } from "./state";
import { RUNNING_IN_ELECTRON } from "./utilities/is-electron";
import { QueuedUrlApiRequest } from "./api-handler";
import { ApiCalls } from "@dicekeys/dicekeys-api-js";
import { ApiRequestsReceivedState } from "./state/ApiRequestsReceivedState";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "./css/lightTheme";
import {IElectronBridge} from "../../common/IElectronBridge";

const electronBridge = (window as unknown as  {ElectronBridge: IElectronBridge}).ElectronBridge;
const ApplicationErrorState = new ErrorState();

/**
 * For web-based apps, scan the URL on page load
 */
try {
  const url = new URL(window.location.href);
  if (url.searchParams.has(ApiCalls.RequestMetadataParameterNames.command)) {
    const request = new QueuedUrlApiRequest(new URL(window.location.href));
    // If we've reached this point, there is a valid API request that needs to be handled.
    // Add it to the queue.
    if (RUNNING_IN_ELECTRON) {
      ApiRequestsReceivedState.enqueueApiRequestReceived(request);
    }else{
      // Open DiceKeys app, or better create a new UI view.
      const schemeBasedApiRequest = "dicekeys://" + url.search;
      window.location.href = schemeBasedApiRequest
    }
  }
} catch {
  // Not a valid request.  Carry on.

  // FUTURE -- throw error if search param had command but it was an invalid command.
}

if (RUNNING_IN_ELECTRON) {

  // Handle app links
  electronBridge.listenForAppLinks(appLink => {
    console.log(appLink)
    try{
      const url = new URL(appLink);
      if (url.searchParams.has(ApiCalls.RequestMetadataParameterNames.command)) {
        const request = new QueuedUrlApiRequest(url);
        ApiRequestsReceivedState.enqueueApiRequestReceived(request);
      }
    }catch (e) {
      console.log(e)
    }
  }, err => {
    console.log(err)
  });
}

window.addEventListener('load', () => {
  document.body.style.setProperty("margin", "0px");
  DiceKeyMemoryStore.onReady( () => {
    ReactDOM.render((
      <ThemeProvider theme={lightTheme}>
        <ErrorHandler errorState={ApplicationErrorState}>
          <WindowTopLevelView />
        </ErrorHandler>
      </ThemeProvider>
    ), document.getElementById("app_container"));
  });
});


// Let the parent know we're ready for messages. // FIXME document in API
if (window.opener) {
  // Using origin "*" is dangerous, but we allow it only to let the window
  // that opened the app know that the window it opened had loaded.
  window.opener?.postMessage("ready", "*");
}
