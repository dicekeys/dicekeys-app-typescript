import styled from "styled-components";

export const PushButton = styled.button<{hidden?: boolean}>`
  display: block;
  visibility: ${props => props.hidden ? "hidden" : "visible"};
  width: fit-content;
  align-self: center;
  border-radius: 0.25rem;
  padding: 0.25rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  margin: 0.5rem;
  &:hover {
    background: rgba(128,128,128,0.3);
  }
`;

export const StepButton = styled.button`
  min-width: 3rem;
  cursor: arrow;
  justify-content: center;
  align-items: baseline;
  background: none;
  border: none;
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  border-radius: 0.25rem;
  user-select: none;
  &:hover {
    background-color: rgba(128,128,128,1);
  }
  &:focus {
    outline:0;
  }
  &:active {
    background-color: gray
  }
`;