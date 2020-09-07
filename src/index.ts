
import {
  EncryptedCrossTabState
} from "./state/encrypted-cross-tab-state"
import {
  AppMain
} from "./web-components/app-main";
import { DerivationOptions, ApiStrings } from "@dicekeys/dicekeys-api-js";

window.addEventListener("load", () => {
  
  EncryptedCrossTabState.instancePromise.then( (appState) => {
    const app = new AppMain({appState});

    window.addEventListener("resize", app.renderSoon );
    
    // For testing
    if (window.origin.startsWith("http://localhost")) {
      app.handleApiMessageEvent({
        origin: "https://localhost",
        data: {
          [ApiStrings.Inputs.COMMON.command]: ApiStrings.Commands.getPassword,
          derivationOptionsJson: JSON.stringify(DerivationOptions({            
            wordLimit: 13
//            mutable: true,
//            excludeOrientationOfFaces: true,
//            cornerLetters: "SWDC"
          }))
        }
      } as MessageEvent)
    }
  });


});
