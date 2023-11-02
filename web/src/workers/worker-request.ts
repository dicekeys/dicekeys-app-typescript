import { jsonStringifyWithSortedFieldOrder } from "../utilities/json";

export class WorkerAborted extends Error {}

export class WorkerRequest<REQUEST, RESULT, REQUEST_MESSAGE extends REQUEST = REQUEST> {
  private worker: Worker | undefined;
  private _cancel: (() => void) | undefined;
  private _result: RESULT | undefined;
  private _resultPromise: Promise<RESULT> | undefined;
  private _request: REQUEST | undefined;
  
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
  ): Promise<RESULT> => {
    // console.log(`calculate called`, this._request, request)
    if (this._resultPromise && jsonStringifyWithSortedFieldOrder(this._request) === jsonStringifyWithSortedFieldOrder(request)) {
      // The request hasn't changed.
      // console.log(`request hasn't changed`)
      return this._resultPromise;
    }
    this._result = undefined;
    this._cancel = undefined;
    this._request = request;
    this._resultPromise = new Promise<RESULT>( (resolve, reject) => {
      const oldWorker = this.worker;
      this.worker = undefined;
      if (oldWorker != null) {
        try {
          oldWorker?.terminate();
        } catch (_) {
          // Do nothing if terminate fails on old worker.
        }
      }
      try {
        this.worker = this.workerFactory();
      } catch (e) {
        reject(e);
        return;
      }  
      const cancel = this._cancel = (e?: unknown) => {
        this._resultPromise = undefined;
        this._request = undefined;
        this._cancel = undefined;
        if (this.terminate()) { reject(e ?? new WorkerAborted()); }
      };
  
      const handleMessageEvent = (messageEvent: MessageEvent) => {
        // console.log(`response`, messageEvent.data);
        resolve(this._result = messageEvent.data as RESULT);
        this.terminate();
      }
  
      this.worker.addEventListener("message", handleMessageEvent);
      this.worker.addEventListener("messageerror", cancel );
      const message = this.requestToRequestMessage(request);
      try {
        this.worker.postMessage(message);
      } catch (e) {
        console.log(`Exception in worker request`, e);
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.resultPromise!;
  }

  private terminate = () => {
    const worker = this.worker;
    if (worker == null)  return false;
    worker.terminate();
    this.worker = undefined;
    return true;
  }

}
