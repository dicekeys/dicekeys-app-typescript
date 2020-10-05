import styles from "./dicekey-svg.module.css";
import * as SVG from "../../dicekeys/svg";

import {
  Attributes,
  Component,
  ComponentEvent,
//  Observable,
} from "../../web-component-framework";
import {
  DiceKeyRenderOptions,
  renderDiceKey,  
} from "../../dicekeys/render-to-svg";
import {
  DiceKey,
  PartialDiceKey,
} from "../../dicekeys/dicekey";
import { Face, FaceDigit, FaceLetter, FaceOrientationLetterTrblOrUnknown } from "@dicekeys/read-dicekey-js";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface EnterDiceKeyOptions extends DiceKeyRenderOptions, Attributes {
}


/**
 * This class implements the component that displays DiceKeys.
 */
export class EnterDiceKey extends Component<EnterDiceKeyOptions, SVGSVGElement> {

  
  // Events

  /**
   * This event is triggered when the DiceKey has been been scanned
   * successfully.
   */
  public readonly diceKeyLoadedEvent = new ComponentEvent<[DiceKey], this>(this);


  currentFaceIndex: number = 0;

  diceKey = Array.from({length: 25}, () => ({orientationAsLowercaseLetterTrbl: 't'} as Partial<Face>)) as PartialDiceKey;

  /**
   * The code supporting the demo page cannot run until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: EnterDiceKeyOptions
  ) {
    super(options, SVG.svg({}));
    // const sizeStr = this.size.toString();
    this.addClass(styles.dicekey_svg);
    document.addEventListener("keydown", this.keyDownListener);
  }

  render() {
    super.render();
    renderDiceKey(this.primaryElement, this.diceKey, {...this.options, highlightDieAtIndex: this.currentFaceIndex});
  }

  remove() {
    if (!super.remove()) {
      return false;
    }
    document.removeEventListener("keydown", this.keyDownListener);
    return true;
  }

  private get currentFace(): Partial<Face> { return this.diceKey[this.currentFaceIndex]; }
  private get previousFaceIndex(): number { return (this.currentFaceIndex + 24) % 25; }
  private get nextFaceIndex(): number { return (this.currentFaceIndex + 1) % 25; }
//  private get previousFace(): Partial<Face> { return this.diceKey[this.previousFaceIndex]; }
  private get nextFace(): Partial<Face> { return this.diceKey[this.nextFaceIndex]; }


  keyDownListener = (event: KeyboardEvent) => {
    const upperKey = event.key.toUpperCase();
    if (FaceLetter.isValid(upperKey)) {
      if (this.currentFace.letter != null && this.nextFace.letter == null) {
        this.currentFaceIndex = this.nextFaceIndex;
      }
      this.currentFace.letter = upperKey;
    } else if (FaceDigit.isValid(upperKey)) {
      if (this.currentFace.digit != null && this.nextFace.digit == null) {
        this.currentFaceIndex = this.nextFaceIndex;
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
      this.currentFaceIndex = ( this.currentFaceIndex + 20 ) % 25;
    } else if (event.code === "ArrowDown") {
      // Move down ( index += 5 % 25 )
      this.currentFaceIndex = ( this.currentFaceIndex + 5 ) % 25;
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
    }
    event.preventDefault();
    this.renderSoon();
  }

};
