import React from "react";
import { observer } from "mobx-react";
import { action, makeAutoObservable } from "mobx";
import { autoSave } from "../../state/core";
import {Layout} from "../../css";
import { CharButton, CharButtonToolTip } from "./CharButton";

const obscuringCharacter = String.fromCharCode(0x25A0); // * ■▓▒░
const obscureValue = (password: string): string => {
  const words = password.split(' ');
  const obscuredWords = words.map( word => word.split("").map( _ => obscuringCharacter).join("")); // * ▓▒░
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

export interface CopyableFieldProps {
  value: string;
  showCopyIcon?: boolean;
}

export interface GeneratedTextFieldViewProps extends CopyableFieldProps {
  obscureValue?: boolean;
  toggleObscureValue?: () => any;
}
export const GeneratedTextFieldView  = observer( (props: GeneratedTextFieldViewProps) => {
  const copyToClipboard = action ( () => {
    navigator.clipboard.writeText(props.value);
    // FUTURE - provide user notification that copy happened.
  });
  return (    
    <div className={Layout.RowCentered}>
      <div key={"value"} style={{fontFamily: "monospace"}}>{ props.obscureValue ? obscureValue(props.value) : props.value }</div>
      { props.obscureValue !== undefined && props.toggleObscureValue ? (
        <CharButton style={ props.obscureValue ? {textDecoration: "line-through"} : {}}
          onClick={props.toggleObscureValue}
        >&#x1F441;<CharButtonToolTip>{ props.obscureValue ? "show" : "hide" }</CharButtonToolTip></CharButton>
      ) : undefined }
      { !props.showCopyIcon ? undefined : (
        <CharButton onClick={copyToClipboard}>&#128203;<CharButtonToolTip>Copy to clipboard</CharButtonToolTip></CharButton>
      )}
    </div>
  );
});

export class GlobalSharedToggleState {
  value: boolean;

  toggle = action ( () => {
    this.value = !this.value;
  })

  constructor(name: string, defaultValue: boolean = false) {
    this.value = defaultValue
    makeAutoObservable(this);
    autoSave(this, `GlobalSharedToggleState:${name}`)
  }
}

const GeneratedTextFieldViewWithSharedToggleStatePreCurry = observer (
  (props: CopyableFieldProps & {toggleState: GlobalSharedToggleState}) => {
    return (
      <GeneratedTextFieldView value={props.value} showCopyIcon={props.showCopyIcon ?? true}
        obscureValue={ props.toggleState.value }
        toggleObscureValue={ props.toggleState.toggle }
      /> 
    )
  }
);

export const GeneratedTextFieldViewWithSharedToggleState =
  (toggleState: GlobalSharedToggleState) =>
    (props: CopyableFieldProps) => (
      <GeneratedTextFieldViewWithSharedToggleStatePreCurry {...{toggleState, ...props}} />
    );

export const GeneratedPasswordView = GeneratedTextFieldViewWithSharedToggleState(new GlobalSharedToggleState("Password", true));
export const GeneratedSecretView = GeneratedTextFieldViewWithSharedToggleState(new GlobalSharedToggleState("Secret", true));
export const GeneratedDiceKeySeedFieldView = GeneratedTextFieldViewWithSharedToggleState(new GlobalSharedToggleState("DiceKeySeed", true));
