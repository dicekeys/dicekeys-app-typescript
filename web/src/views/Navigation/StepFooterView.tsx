
import React from "react";
import {observer} from "mobx-react";
import { PushButton } from "../../css/Button";
import styled from "styled-components";

export const StepFooter = styled.div`
  display: flex;
  flex-direction: column;
  justify-self: flex-end;
  justify-content: center;
  align-content: center;
  margin-bottom: 1vh;
  width: 80vw;
  align-self: center;
  margin-top: auto;
`;

export const StepFooterRow = styled.div`
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
}

export const StepFooterView = observer ( ({
  prev, pprev, next, nnext, nextIsDone, children
}: React.PropsWithChildren<StepFooterViewProps>) => (
  <StepFooter>
    { children == null ? null : (
      <StepFooterRow>
        {children}
      </StepFooterRow>
    ) }
    <StepFooterRow>
      <PushButton $invisible={pprev == null} onClick={ pprev } >&lt;&lt;</PushButton>
      <PushButton $invisible={prev == null} onClick={ prev } >&lt; previous</PushButton>
      <SpaceBetweenLeftAndRightButtons></SpaceBetweenLeftAndRightButtons>
      <PushButton $invisible={next == null} onClick={ next } >{nextIsDone ? "done" : "next"} &gt;</PushButton>
      <PushButton $invisible={nnext == null} onClick={ nnext } >&gt;&gt;</PushButton>
    </StepFooterRow>
  </StepFooter>
));