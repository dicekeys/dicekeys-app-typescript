import * as React from "react";
import { createRoot } from 'react-dom/client';
import {WindowTopLevelView} from "./views/WindowTopLevelView";
import { ErrorHandler } from "./views/ErrorHandler";
import { DiceKeyMemoryStore } from "./state";
import { RUNNING_IN_ELECTRON } from "./utilities/is-electron";
import { QueuedUrlApiRequest } from "./api-handler";
import { ApiCalls } from "@dicekeys/dicekeys-api-js";
import { ApiRequestsReceivedState } from "./state/ApiRequestsReceivedState";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "./css/lightTheme";
import type { ElectronBridgeRendererView } from "../../common/IElectronBridge";
import { RecipeStore } from "./state/stores/RecipeStore";
import { DiceKeyWithKeyId } from "./dicekeys/DiceKey";
import { createTopLevelNavigationState, WindowTopLevelNavigationState } from "./state/WindowTopLevelNavigationState";
import { createGlobalStyle } from 'styled-components';

import InconsolataBoldWoff from "./css/fonts/InconsolataBold.woff";
import InconsolataBoldWoff2 from "./css/fonts/InconsolataBold.woff2";
import { SynchronizedString } from "./state/stores/SynchronizedStringStore";

const GlobalFonts = createGlobalStyle`
  @font-face {
    font-family: "Inconsolata";
    src: local('Inconsolata Bold'), local('InconsolataBold'),
    url(${InconsolataBoldWoff}) format('woff2'),
    url(${InconsolataBoldWoff2}) format('woff');
    font-weight: 700;
    font-style: normal;
  }
`

const electronBridge = (window as unknown as  {ElectronBridge: ElectronBridgeRendererView}).ElectronBridge;

let windowTopLevelNavigationState: WindowTopLevelNavigationState | undefined;

/**
 * For web-based apps, scan the URL on page load
 */
try {
  const url = new URL(window.location.href);
  if (url.searchParams.has(ApiCalls.RequestMetadataParameterNames.command)) {
    const request = new QueuedUrlApiRequest(new URL(window.location.href));
    //  console.log(`Request received`, request);
    // If we've reached this point, there is a valid API request that needs to be handled.
    // Add it to the queue.
    // Open DiceKeys app, or better create a new UI view.
    ApiRequestsReceivedState.enqueueApiRequestReceived(request);
    //  console.log(`Request enqueued for handling by web app`);
    // if (RUNNING_IN_BROWSER) {
      // const schemeBasedApiRequest = "dicekeys:/" + url.search;
      // customProtocolCheck(schemeBasedApiRequest, () => {
      //   // On failure, handle API request locally...
      //   ApiRequestsReceivedState.enqueueApiRequestReceived(request);
      //   console.log(`Request enqueued for handling by web app`);            
      //   // window.location.assign(schemeBasedApiRequest);
      // }, () => {
      //   // On success, we'll do A
      //   window.location.assign(schemeBasedApiRequest);
      //   // setTimeout( () => {window.close();}, 2000)
      // }, 5000 );
    // }
  }
} catch (e) {
  // Not a valid request.  Carry on.
  console.log("Invalid request", window.location.href, e)

  // FUTURE -- throw error if search param had command but it was an invalid command.
}


if (RUNNING_IN_ELECTRON) {  
  const handleAppLink = (appLink: string) => {
    try{
      const url = new URL(appLink);
        if (url.searchParams.has(ApiCalls.RequestMetadataParameterNames.command)) {
          const request = new QueuedUrlApiRequest(url);
          ApiRequestsReceivedState.enqueueApiRequestReceived(request);
        }
    } catch (e) {
      console.log(e)
    }
  }

  const loadRandomDiceKey = async () => {
    const diceKey = await DiceKeyWithKeyId.fromRandom();
    windowTopLevelNavigationState?.onReturnFromActionThatMayLoadDiceKey(diceKey);
  }

  const loadFromShares = async() => {
    windowTopLevelNavigationState?.navigateToRecoverFromShares();
  }

  electronBridge.implementMainToPrimaryRendererAsyncApi({
    "getRecipesToExport": async () => RecipeStore.getStoredRecipesJson(),
    "importRecipes": async (recipesToImport) => RecipeStore.importStoredRecipeAsJsonArray(recipesToImport),
    loadFromShares,
    loadRandomDiceKey,
  });

  electronBridge.implementMainToAllRenderersApi({
    broadcastUpdatedSynchronizedStringState: SynchronizedString.updateFromBroadcast,
  })

  if (electronBridge.osPlatform === "linux" || electronBridge.osPlatform === "win32") {
    // If the application was just launched and the command line contains an API request
    // in the form of a dicekeys:/ link, process it here.
    try {
      electronBridge.commandLineArgs.filter( (x => x.startsWith("dicekeys:/") && x.indexOf("command") > 0))
      .forEach( url => handleAppLink(url ));
    } catch {}
  }
}

window.addEventListener('load', () => {
  document.body.style.setProperty("margin", "0px");
  DiceKeyMemoryStore.onReady( () => {
    const container = document.getElementById("app_container");
    if (container == null) {
      throw "No container element";
    }
    const root = createRoot(container);
    windowTopLevelNavigationState = createTopLevelNavigationState();
    root.render((
      <ThemeProvider theme={lightTheme}>
        <ErrorHandler>
          <GlobalFonts/>
          <WindowTopLevelView state={windowTopLevelNavigationState} />
        </ErrorHandler>
      </ThemeProvider>
    ));
  });
});


// Let the parent know we're ready for messages. // FIXME document in API
if (window.opener) {
  // Using origin "*" is dangerous, but we allow it only to let the window
  // that opened the app know that the window it opened had loaded.
  window.opener?.postMessage("ready", "*");
}
