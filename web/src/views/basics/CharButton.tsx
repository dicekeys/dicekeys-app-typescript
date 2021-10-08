import React from "react";
import { observer } from "mobx-react";
import { action } from "mobx";
import styled from "styled-components";

const CharButtonCss = styled.button`
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
  &:hover {
    transform: translateY(-100%);
    visibility: visible;
    font-size: .75rem;
  }
`;

export const CharButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <CharButtonCss {...props} tabIndex={-1} />
);

export const CharButtonToolTip = styled.span`
  display: flex;
  position: absolute;
  visibility: hidden;
  background: rgba(192,192,192,.75);
  color: rgba(0, 0, 0, .75);
  text-align: center;
  padding: 3px;
  border-radius: 3px;
  z-index: 1;
  transform: translateY(-100%);
  visibility: visible;
  font-size: .75rem;
`;

export interface CopyButtonProps {
  value?: string;
  hideCopyButton?: boolean;
}

export const CopyButton = observer ( (props: CopyButtonProps) => {
  if (props.hideCopyButton) return null;
  const copyToClipboard = action ( () => {
    if (props.value != null) {
      navigator.clipboard.writeText(props.value);
    }
    // FUTURE - provide user notification that copy happened.
  });
  return (
   <CharButton hidden={props.value == null} onClick={copyToClipboard}>&#128203;<CharButtonToolTip></CharButtonToolTip></CharButton>
  );
});

export interface ObscureButtonProps {
  obscureValue: boolean;
  toggleObscureValue: () => any;
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
