import { jsonStringifyWithSortedFieldOrder } from "../api-handler/json";

export class WorkerAborted extends Error {}

export class WorkerRequest<REQUEST, RESULT, REQUEST_MESSAGE extends REQUEST = REQUEST> {
  private worker: Worker | undefined;
  private _cancel: (() => void) | undefined;
  private _result: RESULT | undefined;
  private _resultPromise: Promise<RESULT> | undefined;
  private _request: REQUEST | undefined;
  
  public get cancel(): (() => void) { return this._cancel! }
  public get resultPromise(): Promise<RESULT> | undefined { return this._resultPromise; }
  public get result(): RESULT | undefined { return this._result; }
  public get running(): boolean { return this.worker != null; }

  constructor (
    private readonly workerFactory: () => Worker,
    private readonly requestToRequestMessage: (r: REQUEST) => REQUEST_MESSAGE = (r) => r as REQUEST_MESSAGE
  ) {}

  /**
   * Cancels any prior calculation, unless it was for the same input.
   * 
   * @param request 
   */
  public calculate = (
    request: REQUEST
  ) => {
    if (this._resultPromise && jsonStringifyWithSortedFieldOrder(this._request) === jsonStringifyWithSortedFieldOrder(request)) {
      // The request hasn't changed.
      return this._resultPromise;
    }
    this._result = undefined;
    this._request = request;
    this._resultPromise = new Promise<RESULT>( (resolve, reject) => {
      try {
        this.worker?.terminate();
      } catch (_) {
        // Do nothing if terminate fails on old worker.
      }
      try {
        this.worker = this.workerFactory();
      } catch (e) {
        reject(e);
        return;
      }  
      const cancel = this._cancel = (e: any = new WorkerAborted()) => {
        if (this.terminate()) { reject(e); }
      };
  
      const handleMessageEvent = (messageEvent: MessageEvent) => {
        resolve(this._result = messageEvent.data as RESULT);
        this.terminate();
      }
  
      this.worker.addEventListener("message", handleMessageEvent);
      this.worker.addEventListener("messageerror", cancel );
      this.worker.postMessage(this.requestToRequestMessage(request));
    });
    return this.resultPromise!;
  }

  private terminate = () => {
    const worker = this.worker;
    if (!worker)  return false;
    worker.terminate();
    this.worker = undefined;
    return true;
  }

}
