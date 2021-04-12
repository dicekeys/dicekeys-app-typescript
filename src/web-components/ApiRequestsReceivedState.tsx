
import { makeAutoObservable } from "mobx";
import {
  ApiRequestContext
} from "../api-handler/QueuedApiRequest";

export class ApiRequestsReceivedState {

  apiRequestsReceived: ApiRequestContext[] = [];

  constructor() {
    makeAutoObservable(this);
  }
}