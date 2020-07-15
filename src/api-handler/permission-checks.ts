import {
  ApiCalls, ApiStrings, DerivationOptions, Exceptions
} from "@dicekeys/dicekeys-api-js";

// const listOfCommandsRequiringClientMayRetrieveKey = [
//   ApiStrings.Commands.getSigningKey,
//   ApiStrings.Commands.getUnsealingKey,
//   ApiStrings.Commands.getSymmetricKey,
// ] as const;
// type CommandsRequiringClientMayRetrieveKey = (typeof listOfCommandsRequiringClientMayRetrieveKey)[number]

// const setOfommandsRequiringClientMayRetrieveKey = new Set<ApiStrings.Command>(
//   listOfCommandsRequiringClientMayRetrieveKey
// )
// const doesCommandRequireClientMayRetreiveKey = (
//   command: ApiStrings.Command
// ): command is CommandsRequiringClientMayRetrieveKey =>
//   setOfommandsRequiringClientMayRetrieveKey.has(command);

/**
 * Validate that the client is not receiving a key which operations should be
 * performed in the DiceKeys app without setting "clientMayRetrieveKey": true
 * in the derivation options.
 */
export const throwIfClientMayNotRetrieveKey = (request: ApiCalls.ApiRequestObject) => {
  switch (request.command) {
    case ApiStrings.Commands.getSigningKey:
    case ApiStrings.Commands.getUnsealingKey:
    case ApiStrings.Commands.getSymmetricKey:
      if (!DerivationOptions(request.derivationOptionsJson).clientMayRetrieveKey) {
        throw new Exceptions.ClientMayRetrieveKeyNotSetInDerivationOptions()
      }
      break;
    default:
      break;
  }
}