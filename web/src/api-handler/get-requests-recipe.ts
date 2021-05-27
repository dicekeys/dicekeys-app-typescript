import {
  ApiCalls,
  Exceptions
} from "@dicekeys/dicekeys-api-js"
import { PackagedSealedMessageJson } from "@dicekeys/seeded-crypto-js";


export const extraRequestRecipeAndInstructions = (
  request: ApiCalls.ApiRequestObject
): {recipe: string, unsealingInstructions?: string} => {
  if (
    request.command === ApiCalls.Command.unsealWithSymmetricKey ||
    request.command === ApiCalls.Command.unsealWithUnsealingKey
  ) {
    const packagedSealedMessageJson = JSON.parse(request.packagedSealedMessageJson) as PackagedSealedMessageJson;
    if (
      typeof packagedSealedMessageJson !== "object" ||
      typeof packagedSealedMessageJson.ciphertext !== "string" ||
      typeof packagedSealedMessageJson.recipe !== "string"
    ) {
      throw new Exceptions.MissingParameter("packagedSealedMessageJson");
    }
    const {recipe, unsealingInstructions} = packagedSealedMessageJson;
    return  {recipe, unsealingInstructions};
  } else {
    return {recipe: request.recipe ?? ""}
  }
}