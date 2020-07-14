import { WorkerRequest } from "./worker-request";
import {
  VerifyRequest,
  VerifyResponse,
  AddProofRequest,
  AddProofResponse,
  VerifyRequestMessage,
  AddProofRequestMessage
} from "./derivation-options-proof-worker";

export class VerifyDerivationOptionsWorker extends WorkerRequest<VerifyRequest, VerifyResponse, VerifyRequestMessage> {
  constructor() {
    super(
      () => new Worker("./derivation-options-proof-worker.ts"),
      request => ({action: "verify", ...request})  
    )
  }
}
export class AddDerivationOptionsProofWorker extends WorkerRequest<AddProofRequest, AddProofResponse, AddProofRequestMessage> {
  constructor() {
    super(
      () => new Worker("./derivation-options-proof-worker.ts"),
      request => ({action: "addProof", ...request})  
    )
  }
}
