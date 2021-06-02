import React from "react"
import { observer } from "mobx-react";
import { ErrorState } from "./ErrorState";

type ErrorHandlerProps = React.PropsWithChildren<{
  errorState: ErrorState;
}>;

export const ErrorHandler = observer ( class ErrorHandler extends React.Component<ErrorHandlerProps> {
  constructor(props: ErrorHandlerProps) {
    super(props);
  }

  render() {
    const {error, info} = this.props.errorState;
    if (error != null) {
      return (
        <div className={"FIXME-error"}>
          <div>{ error.name }</div>
          <div>{ error.message }</div>
          <div>{ error.stack ?? "(no stack)" }</div>
          <div>{ JSON.stringify(info) }</div>
        </div>
      )
    } else {
      return this.props.children;
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    (this.props.errorState).setError(error, info);
  }

});