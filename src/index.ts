import {
  ReadDiceKey
} from "./web-components/read-dicekey";
import {
  DisplayDiceKeyCanvas
} from "./web-components/display-dicekey-canvas";
import {
  SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js"
import {
  DiceKey
} from "./dicekeys/dicekey";
import {
  HomeComponent, loadDiceKeyPromise, loadDiceKeyAsync
} from "./web-components/home-component";

const render = async() => {
  // Start by constructing the class that implements the page's functionality
  const body = document.body;
  const state = await DiceKeyAppState.instancePromise;
  while (true) {
    const diceKey = DiceKeyAppState.instance!.diceKey;
    if (diceKey) {
      await new Promise( resolve => 
        (new DisplayDiceKeyCanvas({parentElement: body}, diceKey)).attach().detachEvent.on( resolve ));
    } else if (loadDiceKeyPromise) {
      try {
        await loadDiceKeyPromise;
      } catch (e) {
        // Ignore user cancellations for now
      }
      // The load dicekey interface is currently being displayed.
    } else {
      await new Promise( resolve => 
        HomeComponent.attach({parentElement: body}).detachEvent.on( resolve ) ); 
    }
  }
}

// Don't start until the window is loaded
window.addEventListener("load", 
  () => render()
);

import {
  PostMessagePermissionCheckedMarshalledCommands
} from "./api-handler/post-message-permission-checked-marshalled-commands";
import {
  UsersConsentResponse, RequestForUsersConsent
} from "@dicekeys/dicekeys-api-js";
import { 
  DiceKeyAppState
} from "./state/app-state-dicekey";

const requestUsersConsent = async (
  request: RequestForUsersConsent
): Promise<UsersConsentResponse> => {
  // FIXME -- not yet implemented.
  return UsersConsentResponse.Deny;
}

window.addEventListener("load", () => {
  // Add a message listener
  const handleApiMessageEvent = (messageEvent: MessageEvent) => {
    SeededCryptoModulePromise.then( async seededCryptoModule => {
        const serverApi = new PostMessagePermissionCheckedMarshalledCommands(
        messageEvent,
        loadDiceKeyAsync,
        requestUsersConsent
      );
      if (serverApi.isCommand()) {
        await serverApi.execute();
        const windowName = messageEvent?.data?.windowName;
        // Try to send focus back to calling window.
        if (typeof windowName === "string") {
          const windowOpener = window.opener;// window.open("", windowName);
          windowOpener?.focus();
        }
        // FIXME -- temporary test
        setTimeout( () => window.close(), 3000);
      }
    });
  };
  window.addEventListener("message", handleApiMessageEvent );
  // Let the parent know we're ready for messages. // FIXME document in API
  if (window.opener) {
    // Using origin "*" is dangerous, but we allow it only to let the window
    // that opened the app know that the window it opened had loaded.
    window.opener?.postMessage("ready", "*");
  }
});