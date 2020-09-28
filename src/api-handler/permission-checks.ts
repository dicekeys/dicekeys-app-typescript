import {
  ApiCalls, DerivationOptions, Exceptions
} from "@dicekeys/dicekeys-api-js";

/**
 * Validate that the client is not receiving a key which operations should be
 * performed in the DiceKeys app without setting "clientMayRetrieveKey": true
 * in the derivation options.
 */
export const throwIfClientMayNotRetrieveKey = (request: ApiCalls.ApiRequestObject) => {
  switch (request.command) {
    case ApiCalls.Command.getSigningKey:
    case ApiCalls.Command.getUnsealingKey:
    case ApiCalls.Command.getSymmetricKey:
      if (!DerivationOptions(request.derivationOptionsJson).clientMayRetrieveKey) {
        throw new Exceptions.ClientMayRetrieveKeyNotSetInDerivationOptions()
      }
      break;
    default:
      break;
  }
}