import {
  Attributes,
  HtmlComponent
} from "./html-component";
import {
  DiceKeyRenderOptions,
  renderDiceKey,  
} from "../dicekeys/render";
import {
  Observable
} from "./observable";
import {
  DiceKey,
  PartialDiceKey
} from "../dicekeys/dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface DiceKeyCanvasOptions extends DiceKeyRenderOptions, Attributes {
//  size?: number,
  diceKey: PartialDiceKey,
  obscure: Observable<boolean>,
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

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DiceKeyCanvasOptions
  ) {
    super(options, document.createElement("canvas"));
    // const sizeStr = this.size.toString();
    this.primaryElement.classList.add("dicekey-canvas");

    this.primaryElement.addEventListener("click", () => {
      this.options.obscure.value = !this.options.obscure.value;
    }  );
    this.options.obscure.observe( this.renderSoon );
  }

  render() {
    super.render();
    // console.log("dimensions", this.parent?.primaryElement.offsetWidth, this.parent?.primaryElement.offsetHeight);
    const size = Math.max(512, Math.min(this.primaryElement.parentElement?.offsetWidth ?? 512, this.primaryElement.parentElement?.offsetHeight ?? 512));
    this.primaryElement.setAttribute("height", `${size}`);
    this.primaryElement.setAttribute("width", `${size}`);
    const ctx = this.ctx;
    renderDiceKey(ctx, this.options.diceKey, {...this.options, hide21: this.options.obscure.value});
    if (this.options.obscure.value && this.options.overlayMessage) {
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
