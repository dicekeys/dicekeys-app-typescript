import React from "react";
import { observer } from "mobx-react";
import styled from "styled-components";
// import type {InferComponentProps} from "../../utilities/InferComponentProps";
import { copyToClipboard } from "../../utilities/copyToClipboard";
import { BooleanWithToggle } from "../../state/stores/HideRevealSecretsState";

interface CharButtonExtraProps {$invisible?: boolean}

export const CharButton = styled.button.attrs(() =>({
  tabIndex: -1 as number // Widening type from -1 to number is hack to fix typing issues in StyledComponents/InferComponentProps
}))<CharButtonExtraProps>`
  display: inline flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  margin-left: 0.1rem;
  margin-right: 0.1rem;
  height: 1.5rem;
  width: 1.5rem;
  user-select: none;
  &:hover {
    outline:0;
    background-color: rgba(0,0,0,.1);
  }
  &:active {
    background-color: rgba(0,0,0,.3);
  }
  visibility: ${(p)=>p.$invisible?"hidden":"visible"};
`;

type CharButton = typeof CharButton;

export const CharButtonToolTip = styled.span`
  visibility: hidden;
  ${CharButton}:hover & {
    visibility: visible;
  }
  user-select: none;
  cursor: grab;
  position: absolute;
  text-align: center;
  font-size: .75rem;
  background: rgba(192,192,192,.75);
  color: rgba(0, 0, 0, .75);
  padding: 3px;
  border-radius: 3px;
  z-index: 1;
  transform: translateY(-100%);
`;

export const CopyButton = ({
  valueToCopy, onClick, $invisible: invisible, ...props
}: React.ComponentProps<typeof CharButton> & {valueToCopy?: string}) => (
   <CharButton {...props} $invisible={valueToCopy == null || invisible} onClick={(e)=>{copyToClipboard(valueToCopy); onClick?.(e);}}
   >&#128203;<CharButtonToolTip>Copy</CharButtonToolTip></CharButton>
);

export interface ObscureButtonProps extends BooleanWithToggle {}
const hasObscureButtonProps = (props: Partial<ObscureButtonProps>): props is ObscureButtonProps =>
  props.getValue !== undefined && !!props.toggle

export const ObscureButton = observer ( (props: Partial<ObscureButtonProps>) => {
  if (!hasObscureButtonProps(props)) return null;
  return (
    <CharButton style={ props.getValue() ? {textDecoration: "line-through"} : {}}
        onClick={props.toggle}
    >&#x1F441;<CharButtonToolTip>{ props.getValue() ? "show" : "hide" }</CharButtonToolTip>
    </CharButton>
  );
});
