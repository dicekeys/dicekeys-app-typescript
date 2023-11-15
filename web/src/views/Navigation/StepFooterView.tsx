
import React from "react";
import {observer} from "mobx-react";
import { PushButton } from "../../css/Button";
import styled from "styled-components";

const StepFooter = styled.div`
  display: flex;
  justify-self: flex-end;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  margin-bottom: 1vh;
  width: 80vw;
  align-self: center;
`;

const StepFooterRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: baseline;
`;

const SpaceBetweenLeftAndRightButtons = styled.div`
  min-width: 6rem;
`;

interface StepFooterViewProps {
  prev?: () => void;
  pprev?: () => void;
  next?: () => void;
  nnext?: () => void;
  nextIsDone?: boolean;
  aboveFooter?: JSX.Element | undefined;
}

export const StepFooterView = observer ( (props: StepFooterViewProps) => (
  <StepFooter>
    { props.aboveFooter == null ? null : (
      <StepFooterRow>
        {props.aboveFooter}
      </StepFooterRow>
    ) }
    <StepFooterRow>
      <PushButton $invisible={props.pprev == null} onClick={ props.pprev } >&lt;&lt;</PushButton>
      <PushButton $invisible={props.prev == null} onClick={ props.prev } >&lt; previous</PushButton>
      <SpaceBetweenLeftAndRightButtons></SpaceBetweenLeftAndRightButtons>
      <PushButton $invisible={props.next == null} onClick={ props.next } >{props.nextIsDone ? "done" : "next"} &gt;</PushButton>
      <PushButton $invisible={props.nnext == null} onClick={ props.nnext } >&gt;&gt;</PushButton>
    </StepFooterRow>
  </StepFooter>
));