
import { makeAutoObservable } from "mobx";
import {
  ApiRequestContext
} from "../api-handler/handle-api-request";

export class ApiRequestsReceivedState {

  apiRequestsReceived: ApiRequestContext[] = [];

  constructor() {
    makeAutoObservable(this);
  }
}