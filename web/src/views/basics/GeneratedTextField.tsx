import React from "react";
import { observer } from "mobx-react";
import { ObscureButtonProps, CopyButton, ObscureButton } from "./CharButton";
import { ToggleState } from "../../state";
import { RowCentered } from ".";
import styled from "styled-components";

const obscuringCharacter = String.fromCharCode(0x25A0); // * ■▓▒░

type ObscuringFunction = (unobscuredValue: string) => string;

export const defaultObscuringFunction = (password: string): string => {
  const words = password.split(' ');
  const obscuredWords = words.map( word => word.split("").map( () => obscuringCharacter).join("")); // * ▓▒░
  const sortedObscuredWords = obscuredWords.sort();
  return sortedObscuredWords.join(' ');
}

// We recommend you never write down your DiceKey (there are better ways to copy it)
// or read it over the phone (which you should never be asked to do), but if you
// had a legitimate reason to, removing orientations make it easier and more reliable.

// By removing orientations from your DiceKey before generating a ___,
// your DiceKey will be more than a quadrillion
// (one million billion) times easier to guess, but the number of possible
// values will still be ... 

// This hint makes your DiceKey 303,600 easier to guess.  However, the number of possible
// guesses is still greater than ... .
// The hint does make it possible for others to know that you used the same  DiceKey for multiple
// accounts.


export type OptionallyObscuredTextProps = {
  obscuringFunction?: ObscuringFunction;
  obscureValue?: boolean;
  value?: string;
};

export const OptionallyObscuredText = (props: OptionallyObscuredTextProps): string =>
  props.obscureValue ? (props.obscuringFunction ?? defaultObscuringFunction)(props.value ?? "") : props.value ?? "";

export const OptionallyObscuredTextView = observer( (props: OptionallyObscuredTextProps) => (
  <>{ OptionallyObscuredText(props) }</>
));

export type GeneratedTextFieldViewProps = Partial<ObscureButtonProps> & OptionallyObscuredTextProps & {hideCopyButton?: boolean};

const GeneratedTextValueDiv = styled.div`
  font-family: monospace;
`

export const GeneratedTextFieldView  = observer( (props: GeneratedTextFieldViewProps) => (
    <RowCentered>
      <GeneratedTextValueDiv key={"value"}><OptionallyObscuredTextView {...props} />{
        props.obscureValue ?
          (props.obscuringFunction ?? defaultObscuringFunction)(props.value ?? "") :
          props.value
      }</GeneratedTextValueDiv>
      <ObscureButton {...props} />
      <CopyButton {...props} invisible={!!props.hideCopyButton} valueToCopy={props.value} />
    </RowCentered>
  ));

export const SecretFieldsCommonObscureButton = observer ( () => (
  <ObscureButton obscureValue={ToggleState.ObscureSecretFields.value} toggleObscureValue={ToggleState.ObscureSecretFields.toggle} />
));
export const SecretFieldWithCommonObscureState = observer ((props: GeneratedTextFieldViewProps) => (
  <GeneratedTextFieldView {...props} obscureValue={ ToggleState.ObscureSecretFields.value } />
));


const GeneratedTextFieldViewWithSharedToggleStatePreCurry = observer (
  (({toggleState, ...props}: GeneratedTextFieldViewProps & {toggleState: ToggleState.ToggleState}) => (
      <GeneratedTextFieldView {...props}
        obscureValue={ toggleState.value }
        toggleObscureValue={ toggleState.toggle }
      /> 
    )
  ));


export const GeneratedTextFieldViewWithSharedToggleState =
  ({toggleState, ...defaultProps}: {toggleState: ToggleState.ToggleState} & Partial<GeneratedTextFieldViewProps>) =>
    (props: GeneratedTextFieldViewProps) => (
      <GeneratedTextFieldViewWithSharedToggleStatePreCurry {...{toggleState, ...defaultProps, ...props}} />
    );

export const GeneratedPasswordView = GeneratedTextFieldViewWithSharedToggleState({toggleState: ToggleState.ObscureSecretFields});
// export const GeneratedSecretView = GeneratedTextFieldViewWithSharedToggleState(new ToggleState("Secret", true));
export const GeneratedDiceKeySeedFieldView = GeneratedTextFieldViewWithSharedToggleState({toggleState: ToggleState.ObscureDiceKey});

const obscureDiceKeyInHumanReadableForm = (s: string) =>
  // The 12 triples before the center face should be obscured
  s.slice(0, 12*3).split("").map( () => obscuringCharacter).join("") +
  // The first two characters (letter and digit) of the center face should not be obscured
  s.slice(12*3, 12*3 + 2) +
  // The orientation character of the center face and the last 12 faces should be obscured
  s.slice(12*3 + 2).split("").map( () => obscuringCharacter).join("");

export const DiceKeyAsSeedView = GeneratedTextFieldViewWithSharedToggleState({
  toggleState: ToggleState.ObscureDiceKey,
  hideCopyButton: true,
  obscuringFunction: obscureDiceKeyInHumanReadableForm
});
