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
  HtmlComponent, HtmlComponentConstructorOptions, HtmlComponentOptions
} from "./web-components/html-component"

class NoDiceKey extends HtmlComponent {
  static loadDiceKeyButtonId = "load-dice-key-button";
  private loadDiceKeyButton: HTMLButtonElement | undefined;

  public static instance: NoDiceKey | undefined;
  
  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  private constructor(
    options: HtmlComponentConstructorOptions = {}
  ) {
    super({...options,
      html: `
      <input id="${NoDiceKey.loadDiceKeyButtonId}" type="button" value="Scan your DiceKey"/>
    `});
    NoDiceKey.instance = this;
  }

  attach(options: HtmlComponentOptions = {}) {
    super.attach(options);
    // Bind to HTML
    this.loadDiceKeyButton = document.getElementById(NoDiceKey.loadDiceKeyButtonId) as HTMLButtonElement;

    this.loadDiceKeyButton.addEventListener("click", () => {
      loadDiceKey();
    });
    return this;
  }

  public static create(
    options: HtmlComponentConstructorOptions = {}
  ): NoDiceKey {
    if (NoDiceKey.instance) {
      return NoDiceKey.instance;
    } else {
      NoDiceKey.instance = new NoDiceKey(options);
      return NoDiceKey.instance;
    }
  }

  public static attach(
    options: HtmlComponentConstructorOptions = {}
  ): NoDiceKey {
    NoDiceKey.create(options);
    NoDiceKey.instance?.attach();
    return NoDiceKey.instance!;
  }


}

const render = async() => {
  // Start by constructing the class that implements the page's functionality
  const body = document.body;
  const state = await DiceKeyAppState.instancePromise;
  while (true) {
    const diceKey = DiceKeyAppState.instance!.diceKey;
    if (diceKey) {
      await new Promise( resolve => 
        (new DisplayDiceKeyCanvas({parentElement: body}, diceKey)).attach().onDetach( resolve ));
    } else if (loadDiceKeyPromise) {
      await loadDiceKeyPromise;
      // The load dicekey interface is currently being displayed.
    } else {
      await new Promise( resolve => 
        NoDiceKey.attach({parentElement: body}).onDetach( resolve ) ); 
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
} from "./api-handler/app-state-dicekey";

var loadDiceKeyPromise: Promise<DiceKey> | undefined;
const loadDiceKey = (): Promise<DiceKey> | DiceKey => {
  var diceKey = DiceKeyAppState.instance?.diceKey;
  if (!diceKey) {
    if (!loadDiceKeyPromise) {
      loadDiceKeyPromise = new Promise( (resolve, reject) => {
        new ReadDiceKey({parentElement: document.body}).attach().onDetach( () => {
          DiceKeyAppState.instance?.diceKey ?
            resolve(DiceKeyAppState.instance?.diceKey) :
            reject(new Error("No DiceKey read"));
        }); 
      });
      loadDiceKeyPromise.finally( () => { loadDiceKeyPromise = undefined; } )
      NoDiceKey.instance?.detach();
    }
    return loadDiceKeyPromise;
  }
  return diceKey!;
}

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
        loadDiceKey,
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