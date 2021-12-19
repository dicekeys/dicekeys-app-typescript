import { action, makeAutoObservable } from "mobx";
import {
  QueuedApiRequest
} from "../api-handler/QueuedApiRequest";

class ApiRequestsReceivedStateClass {

  private _apiRequestsReceived: QueuedApiRequest[] = [];
  get apiRequestsReceived() { return [...this._apiRequestsReceived] }
  readonly setApiRequestsReceived = action( (newValue: QueuedApiRequest[]) => {
    this._apiRequestsReceived = newValue;
  });
  
  enqueueApiRequestReceived = action ( (apiRequestReceived: QueuedApiRequest) => {
    this.setApiRequestsReceived([...this._apiRequestsReceived, apiRequestReceived]);
  });
  dequeueApiRequestReceived = action ( () => {
    const [_dequeued, ...remaining] = this._apiRequestsReceived;
    this.setApiRequestsReceived(remaining);
  });
  get foregroundApiRequest(): QueuedApiRequest | undefined {
    return this._apiRequestsReceived?.length > 0 ? this._apiRequestsReceived[0] : undefined;
  }

  constructor() {
    makeAutoObservable(this);
  }
}
export const ApiRequestsReceivedState = new ApiRequestsReceivedStateClass();