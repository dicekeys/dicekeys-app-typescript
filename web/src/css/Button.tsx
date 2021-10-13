import styled from "styled-components";

export const PushButton = styled.button<{invisible?: boolean}>`
  display: block;
  visibility: ${props => props.invisible ? "hidden" : "visible"};
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

export const ButtonRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-top: 0.5rem;
  justify-content: center;
  align-items: baseline;
`;

export const OptionButton = styled(PushButton)`
  &:not(:first-child) {
    margin-left: 2rem;
  }
`

export const StepButton = styled.button<{invisible?: boolean}>`
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
  visibility: ${props=>props.invisible ? "hidden":"visible"};
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