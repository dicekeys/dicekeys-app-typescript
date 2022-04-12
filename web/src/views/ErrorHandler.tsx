import React from "react"
import { observer } from "mobx-react";
import styled from "styled-components";

interface ErrorState {
  error: Error | null;
}


type ErrorHandlerProps = React.PropsWithChildren<{
  errorState: ErrorState;
}>;

const ErrorContainer = styled.div``;
const ErrorNameDiv = styled.div``;
const ErrorMessageDiv = styled.div``;
const ErrorStackDiv = styled.div``;
// const ErrorInfoDiv = styled.div``;

export const ErrorHandler = observer ( class ErrorHandler extends React.Component<React.PropsWithChildren<{}>> {
  state: ErrorState = {error: null};
  constructor(props: ErrorHandlerProps) {
    super(props);
  }

  render() {
    const {state} = this;
    const {error} = state;
    if (error != null) {
      return (
        <ErrorContainer>
          <ErrorNameDiv>{ error.name }</ErrorNameDiv>
          <ErrorMessageDiv>{ error.message }</ErrorMessageDiv>
          <ErrorStackDiv>{ error.stack ?? "(no stack)" }</ErrorStackDiv>
          {/* <ErrorInfoDiv>{ JSON.stringify(info) }</ErrorInfoDiv> */}
        </ErrorContainer>
      )
    } else {
      return this.props.children;
    }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }


  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.log(`Error`, error, info)
    // (this.props.errorState).setError(error, info);
  }

});