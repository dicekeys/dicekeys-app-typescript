
import {
  DiceKeyAppState
} from "./state/app-state-dicekey"
import {
  AppMain
} from "./web-components/main";
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";

window.addEventListener("load", () => {
  
  DiceKeyAppState.instancePromise.then( (appState) => {
    const app = new AppMain({appState});
    
    // For testing
    if (window.origin.startsWith("http://localhost")) {
      app.handleApiMessageEvent({
        origin: "https://localhost",
        data: {
          command: "getSecret",
          derivationOptionsJson: JSON.stringify(DerivationOptions({
            mutable: true,
            excludeOrientationOfFaces: true,
            cornerLetters: "SWDC"
          }))
        }
      } as MessageEvent)
    }
  });


});
