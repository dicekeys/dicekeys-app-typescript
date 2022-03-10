import {
  ApiCalls,
  toFieldNameMap
} from "@dicekeys/dicekeys-api-js";
import {
  ApiRequestWithSeed,
  ExecuteApiResponse,
} from "./api-command-worker";
import { WorkerRequest } from "./worker-request";
import ApiCommandWorker from "../workers/api-command-worker?worker"

export const ApiRequestWithSeedParameterNames = toFieldNameMap<ApiRequestWithSeed<ApiCalls.ApiRequestObject>>(
  "seedString",
  "request"
)

export class ComputeApiCommandWorker<
REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject
> extends WorkerRequest<ApiRequestWithSeed<REQUEST>, ExecuteApiResponse<REQUEST>> {
  constructor() {
    super(
//      () => new Worker(new URL('./api-command-worker.ts'), {type: 'module'}),
      () => {
        const worker = new ApiCommandWorker()
        return worker;
      },
      (request) => request
    )
  }
}
