import React from "react";
import { observer } from "mobx-react";
import { action } from "mobx";
import styled from "styled-components";
import type {InferComponentProps} from "../../utilities/InferComponentProps";

interface CharButtonExtraProps {invisible?: boolean};

export const CharButton = styled.button.attrs(() =>({
  tabIndex: -1 as number // Widening type from -1 to number is hack to fix typing issues in StyledComponents/InferComponentProps
}))<CharButtonExtraProps>`
  display: flex;
  justify-content: center;
  align-items: baseline;
  background: none;
  border: none;
  margin-left: 0.1rem;
  margin-right: 0.1rem;
  height: 1.5rem;
  width: 1.5rem;
  user-select: none;
  &:focus {
    outline:0;
  }
  &:active {
    background: gray;
  }
  visibility: ${p=>p.invisible?"hidden":"visible"};
`;

type CharButton = typeof CharButton;

export const CharButtonToolTip = styled.span`
  visibility: hidden;
  ${CharButton}:hover & {
    visibility: visible;
  }
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

const copyToClipboard = (value?: string) => action ( () => {
  if (value != null) {
    navigator.clipboard.writeText(value);
  }
  // FUTURE - provide user notification that copy happened.
});


export const CopyButton = ({
  valueToCopy, onClick, invisible, ...props
}: InferComponentProps<typeof CharButton> & {valueToCopy?: string}) => (
   <CharButton {...props} invisible={valueToCopy == null || invisible} onClick={(e)=>{copyToClipboard(valueToCopy); onClick?.(e);}}
   >&#128203;<CharButtonToolTip>Copy</CharButtonToolTip></CharButton>
);

export interface ObscureButtonProps {
  obscureValue: boolean;
  toggleObscureValue: () => void;
}
const hasObscureButtonProps = (props: Partial<ObscureButtonProps>): props is ObscureButtonProps =>
  props.obscureValue !== undefined && !!props.toggleObscureValue

export const ObscureButton = observer ( (props: Partial<ObscureButtonProps>) => {
  if (!hasObscureButtonProps(props)) return null;
  return (
    <CharButton style={ props.obscureValue ? {textDecoration: "line-through"} : {}}
        onClick={props.toggleObscureValue}
    >&#x1F441;<CharButtonToolTip>{ props.obscureValue ? "show" : "hide" }</CharButtonToolTip>
    </CharButton>
  );
});
