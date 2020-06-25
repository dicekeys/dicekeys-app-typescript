import {
  HtmlComponent
} from "./html-component";
import {
  renderDiceKey
} from "../dicekeys/render";

import { PartialDiceKey } from "../dicekeys/dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface DiceKeyCanvasOptions {
  size?: number,
  diceKey: PartialDiceKey
}

const cornerIndexes = new Set<number>([0, 4, 20, 24]);
export const removeAllButCornerLettersFromDiceKey = (diceKey: PartialDiceKey): PartialDiceKey =>
  diceKey.map( ({letter}, index) => ({
    letter: cornerIndexes.has(index) ? letter : undefined,
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

  private get size(): number { return this.options.size ?? 640 }

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DiceKeyCanvasOptions
  ) {
    super(options, document.createElement("canvas"));
    const sizeStr = this.size.toString();
    this.primaryElement.setAttribute("height", sizeStr);
    this.primaryElement.setAttribute("width", sizeStr);
  }

  render() {
    super.render();
    renderDiceKey(this.ctx, this.options.diceKey);
  }

};
