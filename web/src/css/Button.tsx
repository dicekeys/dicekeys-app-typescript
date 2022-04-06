import styled from "styled-components";

export const ButtonRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-top: 0.5rem;
  justify-content: center;
  align-items: center;
`;

export const BaseButton = styled.button<{invisible?: boolean}>`
  display: block;
  ${props => props.invisible ? `visibility: hidden` : ``};
  cursor: grab;
  font-size: 1rem;
  user-select: none;
  width: fit-content;
  align-self: center;
  user-select: none;
  &:hover {
    background: rgba(128,128,128,0.3);
  }
`;

export const PushButton = styled(BaseButton)`
  border-width: 1px;
  border-radius: 0.25rem;
  padding: 0.25rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  margin: 0.5rem;
`;

export const OptionButton = styled(PushButton)`
  &:not(:first-child) {
    margin-left: 2rem;
  }
`

export const StepButton = styled(BaseButton)`
  min-width: 3rem;
  text-align: center;
  background: none;
  outline: 0;
  border: none;
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  border-radius: 0.25rem;
  padding: 0.25rem;
  &:focus {
    outline:0;
  }
  &:active {
    background-color: gray
  }`;