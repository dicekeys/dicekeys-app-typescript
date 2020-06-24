import {
  HtmlComponent
} from "./html-component";
import {
  renderDiceKey
} from "../dicekeys/render";
import {
  ComponentEvent
} from "./component-event";
import { DiceKey } from "../dicekeys/dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface DiceKeyCanvasOptions {
  size?: number,
  diceKey: DiceKey,
  obscure?: boolean
}

/**
 * This class implements the component that displays DiceKeys.
 */
export class DiceKeyCanvas extends HtmlComponent<DiceKeyCanvasOptions, HTMLCanvasElement> {
  private static diceKeyDisplayCanvasId = "dicekey-display-canvas";
  private get diceKeyDisplayCanvas(): HTMLCanvasElement {
    return document.getElementById(DiceKeyCanvas.diceKeyDisplayCanvasId) as HTMLCanvasElement;
  }

  private get ctx(): CanvasRenderingContext2D {
    return this.diceKeyDisplayCanvas.getContext("2d")!; 
  }
  protected _obscure?: boolean;
  public get obscure(): boolean { return !!this._obscure; };
  readonly obscureStateChanged = new ComponentEvent<[boolean]>(this);
  public set obscure(value: boolean) {
    this._obscure = value;
    this.obscureStateChanged.send(value);
  }

  private get size(): number { return this.options.size ?? 640 }

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DiceKeyCanvasOptions,
    parentComponent?: HtmlComponent,
  ) {
    super(options, parentComponent, document.createElement("canvas"));
    const sizeStr = this.size.toString();
    this.primaryElement.setAttribute("height", sizeStr);
    this.primaryElement.setAttribute("width", sizeStr);
    this.primaryElement.setAttribute("id", DiceKeyCanvas.diceKeyDisplayCanvasId);
  }

  render() {
    super.render();
    this.addHtml(`
      <canvas id="${DiceKeyCanvas.diceKeyDisplayCanvasId}" height="640", width="640"></canvas>
    `);
    this.obscure = !!this.options.obscure;
    renderDiceKey(this.ctx, this.options.diceKey, this.obscure);
  }

  setObscureState = (obscure: boolean) => {
    this.obscure = obscure;
    renderDiceKey(this.ctx!, this.options.diceKey, this.obscure);
  }

  toggleObscureState = () => this.setObscureState(!this.obscure);
};
