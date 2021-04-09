import React from "react";
import styles from "./password-field.module.css"
import { observer } from "mobx-react";
import { action, makeAutoObservable } from "mobx";
import { autoSave } from "~state/core";

const obscuringCharacter = String.fromCharCode(0x25A0); // * ■▓▒░
const obscurePassword = (password: string): string => {
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

const GlobalSharedObscurePasswordState = new (class GlobalSharedObscurePasswordState {
  obscurePasswordWhenDisplayed: boolean = true;

  toggleObscurePasswordWhenDisplayed = action ( () => {
    this.obscurePasswordWhenDisplayed = !this.obscurePasswordWhenDisplayed;
  })

  constructor() {
    makeAutoObservable(this);
    autoSave("this", "GlobalSharedObscurePasswordState")
  }
})()


export interface DisplayPasswordProps {
  password: string;
  showCopyIcon?: boolean;
}

export const DisplayPassword = observer( (props: DisplayPasswordProps) => {
  const copyToClipboard = action ( () => {
    navigator.clipboard.writeText(props.password);
    // FUTURE - provide user notification that copy happened.
  });
  return (
    <div>
        { !props.showCopyIcon ? undefined : (
          <div key={"copy"} className={styles.copy_icon} onClick={copyToClipboard} >&#128203;</div>
        )}
        <div key={"password"}>{ GlobalSharedObscurePasswordState.obscurePasswordWhenDisplayed ? obscurePassword(props.password) : props.password }</div>
        <div key={"obscure button"}
          className={styles.obscure_icon}
          style={ GlobalSharedObscurePasswordState.obscurePasswordWhenDisplayed ? {textDecoration: "line-through"} : {}}
          onClick={GlobalSharedObscurePasswordState.toggleObscurePasswordWhenDisplayed}
        >&#x1F441;</div>
    </div>
  );
});

