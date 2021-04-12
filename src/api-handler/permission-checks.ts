// import {
//   ApiCalls, Recipe, Exceptions
// } from "@dicekeys/dicekeys-api-js";
// import { requestRequiresRecipeToSetClientMayRetrieveKey } from "@dicekeys/dicekeys-api-js/dist/api-calls";


// /**
//  * Validate that the client is not receiving a key which operations should be
//  * performed in the DiceKeys app without setting "clientMayRetrieveKey": true
//  * in the recipe.
//  */
// export const throwIfClientMayNotRetrieveKey = (request: ApiCalls.ApiRequestObject) => {
//   if (
//     requestRequiresRecipeToSetClientMayRetrieveKey(request) &&
//     !Recipe(request.recipe).clientMayRetrieveKey
//   ) {
//     throw new Exceptions.ClientMayRetrieveKeyNotSetInRecipe()
//   }
// }