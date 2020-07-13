import {
  ApiCalls
} from "@dicekeys/dicekeys-api-js";
import {
  ApiRequestWithSeed
} from "./api-command-worker";


export class WorkerAborted extends Error {}

interface ExecuteApiRequestWithinWorkerResult<
  REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject
> {
  cancel: () => void
  resultPromise: Promise<ApiCalls.ResponseForRequest<REQUEST>>
}

export const executeApiRequestWithinWorker = <
  REQUEST extends ApiCalls.ApiRequestObject = ApiCalls.ApiRequestObject
  >(
    requestAndSeed: ApiRequestWithSeed<REQUEST>
  ): ExecuteApiRequestWithinWorkerResult<REQUEST> => {
  const worker = new Worker('./api-command-worker.ts');
  var terminated = false;
  const terminate = () => {
    if (terminated)  return false;
    terminated = true;
    worker.terminate();
    return true;
  }
  const result = {} as ExecuteApiRequestWithinWorkerResult<REQUEST>;
  result.resultPromise = new Promise<ApiCalls.ResponseForRequest<REQUEST>>( (resolve, reject) => {

    const cancel = result.cancel = (e: any = new WorkerAborted()) => {
      if (terminate()) { reject(e); }
    };

    const handleMessageEvent = (messageEvent: MessageEvent) => {
      terminate();
      resolve(messageEvent.data as ApiCalls.ResponseForRequest<REQUEST>);
    }

    //if ("addEventListener" in worker && typeof worker["addEventListener"] === "function") {
      // web workers
      worker.addEventListener("message", handleMessageEvent);
      worker.addEventListener("messageerror", cancel );
    // } else {
      // node js worker
      // worker.on("message", handleMessageEvent);
      // worker.on("error", cancel);
    // }
    worker.postMessage(requestAndSeed);

  })
  return result;
}
