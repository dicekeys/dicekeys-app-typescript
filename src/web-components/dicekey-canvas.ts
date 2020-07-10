import {
  Attributes,
  HtmlComponent
} from "./html-component";
import {
  DiceKeyRenderOptions,
  renderDiceKey,  
} from "../dicekeys/render";

import {
  DiceKey,
  PartialDiceKey
} from "../dicekeys/dicekey";
import { ComponentEvent } from "./component-event";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface DiceKeyCanvasOptions extends DiceKeyRenderOptions, Attributes {
//  size?: number,
  diceKey: PartialDiceKey,
  overlayMessage?: {
    message: string,
    fontWeight?: string | number,
    fontFamily?: string,
    fontColor?: string,
    fontSizeAsFractionOfBoxSize?: number    
  }
}

export const removeAllButCornerLettersFromDiceKey = (diceKey: PartialDiceKey): PartialDiceKey =>
  diceKey.map( ({letter}, index) => ({
    letter: DiceKey.cornerIndexeSet.has(index) ? letter : undefined,
    digit: undefined,
    orientationAsLowercaseLetterTRBL: undefined
  })) as PartialDiceKey;

/**
 * This class implements the component that displays DiceKeys.
 */
export class DiceKeyCanvas extends HtmlComponent<DiceKeyCanvasOptions, HTMLCanvasElement> {
  private get diceKeyDisplayCanvas(): HTMLCanvasElement { return this.primaryElement; }

  private get ctx(): CanvasRenderingContext2D {
    return this.diceKeyDisplayCanvas.getContext("2d")!; 
  }

  public hide21: boolean;

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DiceKeyCanvasOptions
  ) {
    super(options, document.createElement("canvas"));
    this.hide21 = !!options.hide21;
    // const sizeStr = this.size.toString();
    this.primaryElement.classList.add("dicekey-canvas");


    this.primaryElement.addEventListener("click", () => this.toggleHide21() );
  }

  public readonly hide21Changed = new ComponentEvent<[boolean]>(this);

  toggleHide21 = () => {
    this.hide21 = !this.hide21;
    this.renderSoon();
    this.hide21Changed.send(this.hide21);
  }

  render() {
    super.render();
    console.log("dimesions", this.parent?.primaryElement.offsetWidth, this.parent?.primaryElement.offsetHeight);
    const size = Math.max(512, Math.min(this.primaryElement.parentElement?.offsetWidth ?? 512, this.primaryElement.parentElement?.offsetHeight ?? 512));
    this.primaryElement.setAttribute("height", `${size}`);
    this.primaryElement.setAttribute("width", `${size}`);
    const ctx = this.ctx;
    renderDiceKey(ctx, this.options.diceKey, {...this.options, hide21: this.hide21});
    if (this.hide21 && this.options.overlayMessage) {
      const {message, fontColor = "#000000", fontSizeAsFractionOfBoxSize = 1/12 , fontWeight = "normal", fontFamily = FontFamily} = this.options.overlayMessage;
      const fontSize = size * fontSizeAsFractionOfBoxSize;
      ctx.textAlign = "center";
      const font = `${ fontWeight } ${ fontSize }px ${ fontFamily }, monospace`;
      ctx.font = font;
      ctx.fillStyle = fontColor;
      ctx.fillText(message, this.diceKeyDisplayCanvas.width / 2, (this.diceKeyDisplayCanvas.height / 2) + (fontSize * 0.3) ); // 0.3 adjusts for baseline
      }
  }

};
