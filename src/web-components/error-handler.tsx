import React from "react"
import { observer } from "mobx-react";
import { action, makeAutoObservable } from "mobx";

class ErrorState {
  error: Error | undefined = undefined;
  info: React.ErrorInfo | undefined = undefined;

  setError = action ( (error: Error, info: React.ErrorInfo) => {
    this.error = error;
    this.info = info;
  });

  clearError = action ( () => {
    this.error = undefined;
    this.info = undefined;
  });

  constructor(error?: Error, info?: React.ErrorInfo) {
    this.error = error;
    this.info = info;
    makeAutoObservable(this);
  }

  // static instance = new ErrorState();
  // static setError = action( (error: Error, info: React.ErrorInfo) => ErrorState.instance.setError(error, info) );
  // static clearError = action( () => ErrorState.instance.clearError() );
};
export const ApplicationErrorState = new ErrorState();


type ErrorHandlerProps = React.PropsWithChildren<{
  errorState?: ErrorState;
}>;

export const ErrorHandler = observer ( class ErrorHandler extends React.Component<ErrorHandlerProps> {
  constructor(props: ErrorHandlerProps) {
    super(props);
    makeAutoObservable(this);
  }

  render() {
    const {error, info} = this.props.errorState ?? ApplicationErrorState;
    if (error) {
      return (
        <div className={"FIXME-error"}>{ error.name }{ error.message }{ error.stack }{ info }</div>
      )
    }
    return this.props.children;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    (this.props.errorState ?? ApplicationErrorState).setError(error, info);
  }

});