

import { getRandomBytes } from "~dicekeys/get-random-bytes";
import { AddRecipeProofWorker } from "~workers/call-recipe-proof-worker";
import {
  ApiCalls,
  Recipe,
  urlSafeBase64Encode,
} from "@dicekeys/dicekeys-api-js";
import {
  jsonStringifyWithSortedFieldOrder
} from "./json";

const addRecipeProofWorker = new AddRecipeProofWorker();

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
  if (!ApiCalls.requestHasRecipeParameter(request)) {
    return request;
  }
  const derivationOptions = Recipe(request.recipe);
  if (request.recipe !== "" && !request.recipeMayBeModified) {
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
      recipe: (await addRecipeProofWorker.calculate({
          seedString,
          recipe: jsonStringifyWithSortedFieldOrder(derivationOptions),
        })).recipe
    };
  } else {
    return {...request, recipe: jsonStringifyWithSortedFieldOrder(derivationOptions)};
  }
}