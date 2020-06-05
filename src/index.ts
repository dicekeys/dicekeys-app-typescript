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

const runDemo = async() => {
    // Start by constructing the class that implements the page's functionality\
    const body = document.body;
    const diceKey = await new ReadDiceKey(document.body).promise;
    new DisplayDiceKeyCanvas(document.body, {}, diceKey);

    const hrf = DiceKey.toHumanReadableForm(diceKey);
    const seededCryptoModule = await SeededCryptoModulePromise;
    const unsealingKey = seededCryptoModule.UnsealingKey.deriveFromSeed(hrf, "");
    const sealingKey = unsealingKey.getSealingKey();
    console.log("Sealing (public) key", sealingKey.toJson());
    unsealingKey.delete();
    sealingKey.delete();

}

// Don't start until the window is loaded
window.addEventListener("load", 
  () => runDemo()
);

import { PostMessagePermissionCheckedMarshalledCommands } from "./api-handler/post-message-permission-checked-marshalled-commands";
import { UsersConsentResponse, RequestForUsersConsent } from "./api/unsealing-instructions";
import { DiceKeyAppState } from "./api-handler/app-state-dicekey";

const loadDiceKey = async () => {
  var diceKey = DiceKeyAppState.instance?.diceKey;
  if (!diceKey) {
    diceKey = await new ReadDiceKey(document.body).promise;
    DiceKeyAppState.instance!.diceKey = diceKey;
  }
  return diceKey;
}

const requestUsersConsent = async (
  request: RequestForUsersConsent
): Promise<UsersConsentResponse> => {
  // FIXME -- not yet implemented.
  return UsersConsentResponse.Deny;
}

SeededCryptoModulePromise.then( seededCryptoModule => {
  const handleApiMessageEvent = (messageEvent: MessageEvent) => {

    const sendResponse = (data: object) => {
      postMessage(data, messageEvent.origin);
    }

    const serverApi = new PostMessagePermissionCheckedMarshalledCommands(
      messageEvent,
      loadDiceKey,
      requestUsersConsent,
      sendResponse
    );
    serverApi.execute();
  };

  window.addEventListener("message", handleApiMessageEvent )
});