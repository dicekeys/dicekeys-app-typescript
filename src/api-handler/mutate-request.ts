

import { getRandomBytes } from "~dicekeys/get-random-bytes";
import { AddDerivationOptionsProofWorker } from "~workers/call-derivation-options-proof-worker";
import {
  ApiCalls,
  DerivationOptions,
  urlSafeBase64Encode,
} from "@dicekeys/dicekeys-api-js";
import {
  jsonStringifyWithSortedFieldOrder
} from "./json";

const addDerivationOptionsProofWorker = new AddDerivationOptionsProofWorker();

export const mutateRequest = async <REQUEST extends ApiCalls.ApiRequestObject>({
    seedString,
    request,
    excludeOrientationOfFaces,
    seedHint,
    addUniqueId
  }: 
  {
    seedString: string,
    request: REQUEST,
    excludeOrientationOfFaces?: boolean;
    seedHint?: string;
    addUniqueId?: boolean
  }
): Promise<REQUEST> => {
  if (!ApiCalls.requestHasDerivationOptionsParameter(request)) {
    return request;
  }
  const derivationOptions = DerivationOptions(request.derivationOptionsJson);
  if (request.derivationOptionsJson !== "" && !derivationOptions.mutable) {
    return request;
  }

  if (excludeOrientationOfFaces) {
    derivationOptions.excludeOrientationOfFaces = true;
  } else if (excludeOrientationOfFaces === false) {
    delete derivationOptions.excludeOrientationOfFaces;
  }

  if (seedHint) {
    derivationOptions.seedHint = seedHint;
  } else {
    delete derivationOptions.seedHint;
  }

  if (addUniqueId) {
    (derivationOptions as {uniqueId: string}).uniqueId = urlSafeBase64Encode(getRandomBytes(8))
  }

  if (derivationOptions.proofOfPriorDerivation === "") {
    return {...request,
      derivationOptionsJson: (await addDerivationOptionsProofWorker.calculate({
          seedString,
          derivationOptionsJson: jsonStringifyWithSortedFieldOrder(derivationOptions),
        })).derivationOptionsJson
    };
  } else {
    delete derivationOptions.mutable;
    return {...request, derivationOptionsJson: jsonStringifyWithSortedFieldOrder(derivationOptions)};
  }
}