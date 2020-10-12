import {
  ApiCalls,
  Exceptions
} from "@dicekeys/dicekeys-api-js"
import { PackagedSealedMessageJson } from "@dicekeys/seeded-crypto-js";

export const extraRequestDerivationOptionsAndInstructions = (
  request: ApiCalls.ApiRequestObject
): {derivationOptionsJson: string, unsealingInstructions?: string} => {
  if (
    request.command === ApiCalls.Command.unsealWithSymmetricKey ||
    request.command === ApiCalls.Command.unsealWithUnsealingKey
  ) {
    const packagedSealedMessageJson = JSON.parse(request.packagedSealedMessageJson) as PackagedSealedMessageJson;
    if (
      typeof packagedSealedMessageJson !== "object" ||
      typeof packagedSealedMessageJson.ciphertext !== "string" ||
      typeof packagedSealedMessageJson.derivationOptionsJson !== "string"
    ) {
      throw new Exceptions.MissingParameter("packagedSealedMessageJson");
    }
    const {derivationOptionsJson, unsealingInstructions} = packagedSealedMessageJson;
    return  {derivationOptionsJson, unsealingInstructions};
  } else {
    return {derivationOptionsJson: request.derivationOptionsJson}
  }
}