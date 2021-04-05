import React from "react";
import layoutStyles from "../layout.module.css";
import styles from "./enter-dicekey.module.css";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
// import {
//   DiceKeyRenderOptions
// } from "~/dicekeys/render-to-svg";
import {
  DiceKey,
  ReadOnlyTupleOf25Items,
} from "../../dicekeys/dicekey";
import { Face, FaceDigit, FaceLetter, FaceOrientationLetterTrblOrUnknown } from "@dicekeys/read-dicekey-js";
import { CenteredControls } from "~/web-components/basics";
import { DiceKeyRenderOptions, DiceKeyView } from "../../web-components/display-dicekey/dicekey-view";
// export const FontFamily = "Inconsolata";
// export const FontWeight = "700";


export interface EnterDiceKeyOptions extends DiceKeyRenderOptions {
  onDiceKeyEntered: (diceKey: DiceKey) => void,
  onCancelled: () => void,
//  partialDiceKey?: ReadOnlyTupleOf25Items<ObservablePartialFace>;
//  isValid?: boolean;
  showButtons?: boolean
}

class EnterDiceKeyState {
  currentFaceIndex: number = 0;

  get isValid(): boolean {
    return DiceKey.validate(this.partialDiceKey)!!
  }

  get diceKey(): DiceKey | undefined {
    return DiceKey.validate(this.partialDiceKey) ? this.partialDiceKey : undefined;
  }

  readonly partialDiceKey: ReadOnlyTupleOf25Items<Partial<Face>> = Array.from({length: 25}, () => 
    ({orientationAsLowercaseLetterTrbl: 't'} as Partial<Face>)) as ReadOnlyTupleOf25Items<Partial<Face>>;

    constructor() {
    makeAutoObservable(this);
  }

  private get currentFace(): Partial<Face> { return this.partialDiceKey![this.currentFaceIndex!]; }
  private get previousFaceIndex(): number { return (this.currentFaceIndex! + 24) % 25; }
  private get nextFaceIndex(): number { return (this.currentFaceIndex! + 1) % 25; }
  private get nextFace(): Partial<Face> { return this.partialDiceKey[this.nextFaceIndex]; }


  keyDownListener = action( (event: React.KeyboardEvent) => {
    const upperKey = event.key.toUpperCase();
    if (FaceLetter.isValid(upperKey)) {
      if (this.currentFace.letter != null && this.currentFace.digit != null && this.nextFace.letter == null) {
        this.currentFaceIndex = this.nextFaceIndex;
      }
      this.currentFace.letter = upperKey;
    } else if (FaceDigit.isValid(upperKey)) {
      if (this.currentFace.letter != null && this.currentFace.digit != null && this.nextFace.digit == null) {
        this.currentFaceIndex =this.nextFaceIndex;
      }
      this.currentFace.digit = upperKey;
    } else if (
      ((event.shiftKey || event.ctrlKey) && event.code === "ArrowRight") ||
      event.key === "+" ||
      event.key === "=" ||
      event.key === "]" ||
      event.key === "." ||
      event.key === ">" ||
      event.key === "'"
    ) {
      // Rotate right
      this.currentFace.orientationAsLowercaseLetterTrbl =
        FaceOrientationLetterTrblOrUnknown.rotate(this.currentFace.orientationAsLowercaseLetterTrbl ?? 't', 1) ?? 't';      
    } else if (
      ( (event.shiftKey || event.ctrlKey) && event.code === "ArrowLeft") ||
      event.key === "_" ||
      event.key === "-" ||
      event.key === "[" ||
      event.key === "," ||
      event.key === "<" ||
      event.key === ";"
    ) {
      // Rotate left
      this.currentFace.orientationAsLowercaseLetterTrbl =
        FaceOrientationLetterTrblOrUnknown.rotate(this.currentFace.orientationAsLowercaseLetterTrbl ?? 't', 3) ?? 't';
    } else if (event.code === "ArrowUp") {
      // Move up ( index -= 5 % 25 )
      this.currentFaceIndex = ( this.currentFaceIndex! + 20 ) % 25;
    } else if (event.code === "ArrowDown") {
      // Move down ( index += 5 % 25 )
      this.currentFaceIndex = ( this.currentFaceIndex! + 5 ) % 25;
    } else if (event.code === "ArrowLeft" || ((event.shiftKey || event.ctrlKey) && (event.code === "Tab" || event.code === "Space"))) {
      // Move left
      this.currentFaceIndex = this.previousFaceIndex;
    } else if (event.code === "ArrowRight" || ((!event.shiftKey && !event.ctrlKey) && (event.code === "Tab" || event.code === "Space"))) {
      // Move right
      this.currentFaceIndex = this.nextFaceIndex;
    } else if (event.code === "Delete") {
      delete this.currentFace.letter;
      delete this.currentFace.digit;
      this.currentFace.orientationAsLowercaseLetterTrbl = 't';
    } else if (event.code === "Backspace") {
      if (this.currentFace.letter == null && this.currentFace.digit == null) {
        this.currentFaceIndex = this.previousFaceIndex;
      } else {
        delete this.currentFace.letter;
        delete this.currentFace.digit;
        this.currentFace.orientationAsLowercaseLetterTrbl = 't';
      }
    } else if (event.code === "Home") {
      this.currentFaceIndex = 0;
    } else if (event.code === "End") {
      this.currentFaceIndex = 24;
    } else {
      // No key found.  Do nothing and allow (DO NOT prevent) default
      return;
    }
    event.preventDefault();
  });
}

/**
 * This class implements the component that allows manual entry of DiceKeys.
 */
export const EnterDiceKey = observer( (props: React.PropsWithChildren<EnterDiceKeyOptions & {state?: EnterDiceKeyState}>) => {
  const state = props.state ?? new EnterDiceKeyState();

  return (
    <div className={layoutStyles.stretched_column_container} onKeyDown={ (e) => state.keyDownListener(e) }>
      <div className={styles.key_hints}>
        To rotate the current face, use either &lt; &gt;, - +, or CTRL arrow (right and left arrows).
      </div>
      <DiceKeyView diceKey={state.partialDiceKey} />
      <CenteredControls>
        {props.children}
      </CenteredControls>
    </div>
  )
});