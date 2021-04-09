

import { getRandomBytes } from "~utilities/get-random-bytes";
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
  const recipe = Recipe(request.recipe);
  if (request.recipe !== "" && !request.recipeMayBeModified) {
    return request;
  }

  if (excludeOrientationOfFaces) {
    recipe.excludeOrientationOfFaces = true;
  } else if (excludeOrientationOfFaces === false) {
    delete recipe.excludeOrientationOfFaces;
  }

  if (seedHint) {
    recipe.seedHint = seedHint;
  } else {
    delete recipe.seedHint;
  }

  if (addUniqueId) {
    (recipe as {uniqueId: string}).uniqueId = urlSafeBase64Encode(getRandomBytes(8))
  }

  if (recipe.proofOfPriorDerivation === "") {
    return {...request,
      recipe: (await addRecipeProofWorker.calculate({
          seedString,
          recipe: jsonStringifyWithSortedFieldOrder(recipe),
        })).recipe
    };
  } else {
    return {...request, recipe: jsonStringifyWithSortedFieldOrder(recipe)};
  }
}