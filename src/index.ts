
import {
  DiceKeyAppState
} from "./state/app-state-dicekey"
import {
  AppMain
} from "./web-components/main";

window.addEventListener("load", () => {
  
  DiceKeyAppState.instancePromise.then( (appState) => {
    new AppMain({appState});
  });

});