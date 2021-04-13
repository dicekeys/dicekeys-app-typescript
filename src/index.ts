// import {
//   AppMain
// } from "./web-components/app-main";
// import { Recipe, ApiCalls } from "@dicekeys/dicekeys-api-js";

// window.addEventListener("load", () => {
  
//   EncryptedCrossTabState.instancePromise.then( (appState) => {
//     const app = new AppMain({appState});

//     // Removed -- not everything should re-render on resize -- probably just scanning experience?
//     // window.addEventListener("resize", app.renderSoon );
    
//     // For testing
//     if (false && window.origin.startsWith("http://localhost")) {
//       app.handleApiMessageEvent({
//         origin: "https://localhost",
//         data: {
//           "command": ApiCalls.Command.getPassword,
//           recipe: JSON.stringify(Recipe({  
//             allow: [{host: "localhost"}]        
// //            excludeOrientationOfFaces: true,
// //            cornerLetters: "SWDC"
//           }))
//         }
//       } as MessageEvent)
//     }
//   });


// });
