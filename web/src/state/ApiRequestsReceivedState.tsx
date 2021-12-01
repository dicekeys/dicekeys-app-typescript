
import { action, makeAutoObservable } from "mobx";
import {
  QueuedApiRequest
} from "../api-handler/QueuedApiRequest";

class ApiRequestsReceivedStateClass {

  apiRequestsReceived: QueuedApiRequest[] = [];
  enqueueApiRequestReceived = action ( (apiRequestReceived: QueuedApiRequest) => {
    this.apiRequestsReceived.push(apiRequestReceived);
  });
  dequeueApiRequestReceived = action ( () => {
    this.apiRequestsReceived.shift();
  });
  get foregroundApiRequest(): QueuedApiRequest | undefined {
    return this.apiRequestsReceived?.length > 0 ? this.apiRequestsReceived[0] : undefined;
  }

  constructor() {
    makeAutoObservable(this);
  }
}
export const ApiRequestsReceivedState = new ApiRequestsReceivedStateClass();