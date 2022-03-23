export interface ViewState<VIEW_NAMES extends string> {
  viewName: VIEW_NAMES;
}

export class NamedViewState<VIEW_NAME extends string> implements ViewState<VIEW_NAME> {
  constructor(readonly viewName: VIEW_NAME) {}
}
