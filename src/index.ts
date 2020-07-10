
import {
  DiceKeyAppState
} from "./state/app-state-dicekey"
import {
  AppMain
} from "./web-components/main";
import { DerivationOptions, ApiStrings } from "@dicekeys/dicekeys-api-js";

window.addEventListener("load", () => {
  
  DiceKeyAppState.instancePromise.then( (appState) => {
    const app = new AppMain({appState});

    window.addEventListener("resize", app.renderSoon );
    
    // For testing
    if (window.origin.startsWith("http://localhost")) {
      app.handleApiMessageEvent({
        origin: "https://localhost",
        data: {
          [ApiStrings.Inputs.COMMON.command]: ApiStrings.Commands.getPassword,
          [ApiStrings.Inputs.getPassword.wordLimit]: "10",
          derivationOptionsJson: JSON.stringify(DerivationOptions({            
//            mutable: true,
//            excludeOrientationOfFaces: true,
//            cornerLetters: "SWDC"
          }))
        }
      } as MessageEvent)
    }
  });


});
