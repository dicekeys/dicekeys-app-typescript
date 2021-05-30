
import { makeAutoObservable } from "mobx";
import {
  QueuedApiRequest
} from "../api-handler/QueuedApiRequest";

export class ApiRequestsReceivedState {

  apiRequestsReceived: QueuedApiRequest[] = [];

  constructor() {
    makeAutoObservable(this);
  }
}