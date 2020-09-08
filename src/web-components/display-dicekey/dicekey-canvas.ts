import styles from "./dicekey-canvas.module.css"
import {
  Attributes,
  Component,
  Observable,
} from "../../web-component-framework";
import {
  DiceKeyRenderOptions,
  renderDiceKey,  
} from "../../dicekeys/render";
import {
  DiceKey,
  PartialDiceKey
} from "../../dicekeys/dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface DiceKeyCanvasOptions extends DiceKeyRenderOptions, Attributes {
  diceKey: PartialDiceKey,
  overlayMessage?: {
    message: string,
    fontWeight?: string | number,
    fontFamily?: string,
    fontColor?: string,
    fontSizeAsFractionOfBoxSize?: number    
  }
}

const obscure = new Observable<boolean>(true);

export const removeAllButCornerLettersFromDiceKey = (diceKey: PartialDiceKey): PartialDiceKey =>
  diceKey.map( ({letter}, index) => ({
    letter: DiceKey.cornerIndexSet.has(index) ? letter : undefined,
    digit: undefined,
    orientationAsLowercaseLetterTrbl: undefined
  })) as PartialDiceKey;

/**
 * This class implements the component that displays DiceKeys.
 */
export class DiceKeyCanvas extends Component<DiceKeyCanvasOptions, HTMLCanvasElement> {
  private get diceKeyDisplayCanvas(): HTMLCanvasElement { return this.primaryElement; }

  private get ctx(): CanvasRenderingContext2D {
    return this.diceKeyDisplayCanvas.getContext("2d")!; 
  }

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DiceKeyCanvasOptions
  ) {
    super(options, document.createElement("canvas"));
    // const sizeStr = this.size.toString();
    this.addClass(styles.DiceKeyCanvas);

    this.primaryElement.addEventListener("click", () => {
      obscure.value = !obscure.value;
    }  );
    obscure.observe( this.renderSoon );
  }

  render() {
    super.render();
    // console.log("dimensions", this.parent?.primaryElement.offsetWidth, this.parent?.primaryElement.offsetHeight);
    const size = Math.max(512, Math.min(this.primaryElement.parentElement?.offsetWidth ?? 512, this.primaryElement.parentElement?.offsetHeight ?? 512));
    this.primaryElement.setAttribute("height", `${size}`);
    this.primaryElement.setAttribute("width", `${size}`);
    const ctx = this.ctx;
    const overlayMessage = this.options.overlayMessage ?? {
      message: "press to open box",
      fontFamily: "Sans-Serif",
      fontColor: "#00A000",
      fontWeight: 600,
    }
    renderDiceKey(ctx, this.options.diceKey, {...this.options, hide21: obscure.value});
    if (obscure.value && overlayMessage) {
      const {message, fontColor = "#000000", fontSizeAsFractionOfBoxSize = 1/12 , fontWeight = "normal", fontFamily = FontFamily} = overlayMessage;
      const fontSize = size * fontSizeAsFractionOfBoxSize;
      ctx.textAlign = "center";
      const font = `${ fontWeight } ${ fontSize }px ${ fontFamily }, monospace`;
      ctx.font = font;
      ctx.fillStyle = fontColor;
      ctx.fillText(message, this.diceKeyDisplayCanvas.width / 2, (this.diceKeyDisplayCanvas.height / 2) + (fontSize * 0.3) ); // 0.3 adjusts for baseline
      }
  }

};
