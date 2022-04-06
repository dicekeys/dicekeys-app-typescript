import { NavigationPathState } from "./NavigationPathState";

export interface ViewState<VIEW_NAME extends string = string> {
  viewName: VIEW_NAME;
  navState: NavigationPathState;
}

