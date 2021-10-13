// import "core-js/stable";
// import "regenerator-runtime/runtime";

// Hack to allow the webassembly module to load since it looks for window
// FUTURE - can this be removed with better use of emscripten to generate non-broken code?
// is this an artifact of the use of parcel when Stuart was testing this? 
// (global as any).Window = (self as any).Window || self;

import {
  ProofOfPriorDerivationModule
} from "../api-handler/mutate-recipe"

/**
 * A request to process an image frame while scanning dicekeys
 */
export interface VerifyRequest {
  seedString: string;
  recipe: string;
}

export interface VerifyRequestMessage extends VerifyRequest {
  action: "verify";
}

export interface VerifyResponse {
  verified: boolean;
}

export interface AddProofRequest {
  seedString: string;
  recipe: string;
}

export interface AddProofRequestMessage extends AddProofRequest {
  action: "addProof",
}

export interface AddProofResponse {
  recipe: string;
}

const isVerifyRequest = (data: any): data is VerifyRequestMessage =>
  typeof data === "object" && data.action === "verify";

const isAddProofRequest = (data: any): data is AddProofRequestMessage =>
  typeof data === "object" && data.action === "addProof";


addEventListener( "message", async (requestMessage) =>
  ProofOfPriorDerivationModule.instancePromise.then( proofOfPriorDerivationModule => {
    const {data} = requestMessage;
    if (isVerifyRequest(data)) {
      const {seedString, recipe} = data;
      const result: VerifyResponse = {verified: proofOfPriorDerivationModule.verify(seedString, recipe)};
      (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage(result);
    } else if (isAddProofRequest(data)) {
      const {seedString, recipe} = data;
      const result: AddProofResponse = {
        recipe: proofOfPriorDerivationModule.addToRecipeJson(seedString, recipe)
      };
      (self as unknown as {postMessage: (m: any, t?: Transferable[]) => unknown}).postMessage(result);
    }
  })
)
