import { WorkerRequest } from "./worker-request";
import {
  VerifyRequest,
  VerifyResponse,
  AddProofRequest,
  AddProofResponse,
  VerifyRequestMessage,
  AddProofRequestMessage
} from "./recipe-proof-worker";

export class VerifyRecipeWorker extends WorkerRequest<VerifyRequest, VerifyResponse, VerifyRequestMessage> {
  constructor() {
    super(
      () => new Worker("./recipe-proof-worker.ts"),
      request => ({action: "verify", ...request})  
    )
  }
}
export class AddRecipeProofWorker extends WorkerRequest<AddProofRequest, AddProofResponse, AddProofRequestMessage> {
  constructor() {
    super(
      () => new Worker("./recipe-proof-worker.ts"),
      request => ({action: "addProof", ...request})  
    )
  }
}
