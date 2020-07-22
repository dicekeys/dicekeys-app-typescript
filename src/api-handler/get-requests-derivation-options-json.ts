import {
  ApiCalls
} from "@dicekeys/dicekeys-api-js"


export const getRequestsDerivationOptionsJson = (
  request: ApiCalls.ApiRequestObject
): string => ("derivationOptionsJson" in request) ?
  request.derivationOptionsJson :
  request.packagedSealedMessageFields.derivationOptionsJson
