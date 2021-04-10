import React from "react"
import { observer } from "mobx-react";
import { makeAutoObservable } from "mobx";
import { ErrorState } from "./ErrorState";

type ErrorHandlerProps = React.PropsWithChildren<{
  errorState: ErrorState;
}>;

export const ErrorHandler = observer ( class ErrorHandler extends React.Component<ErrorHandlerProps> {
  constructor(props: ErrorHandlerProps) {
    super(props);
    makeAutoObservable(this);
  }

  render() {
    const {error, info} = this.props.errorState;
    if (error) {
      return (
        <div className={"FIXME-error"}>{ error.name }{ error.message }{ error.stack }{ info }</div>
      )
    }
    return this.props.children;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    (this.props.errorState).setError(error, info);
  }

});