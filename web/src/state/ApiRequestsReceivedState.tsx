
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
    return this.apiRequestsReceived[0];
  }

  constructor() {
    makeAutoObservable(this);
  }
}
export const ApiRequestsReceivedState = new ApiRequestsReceivedStateClass();