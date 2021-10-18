import React from "react"
import { observer } from "mobx-react";
import { ErrorState } from "./ErrorState";
import styled from "styled-components";

type ErrorHandlerProps = React.PropsWithChildren<{
  errorState: ErrorState;
}>;

const ErrorContainer = styled.div``;
const ErrorNameDiv = styled.div``;
const ErrorMessageDiv = styled.div``;
const ErrorStackDiv = styled.div``;
const ErrorInfoDiv = styled.div``;

export const ErrorHandler = observer ( class ErrorHandler extends React.Component<ErrorHandlerProps> {
  constructor(props: ErrorHandlerProps) {
    super(props);
  }

  render() {
    const {error, info} = this.props.errorState;
    if (error != null) {
      return (
        <ErrorContainer>
          <ErrorNameDiv>{ error.name }</ErrorNameDiv>
          <ErrorMessageDiv>{ error.message }</ErrorMessageDiv>
          <ErrorStackDiv>{ error.stack ?? "(no stack)" }</ErrorStackDiv>
          <ErrorInfoDiv>{ JSON.stringify(info) }</ErrorInfoDiv>
        </ErrorContainer>
      )
    } else {
      return this.props.children;
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    (this.props.errorState).setError(error, info);
  }

});