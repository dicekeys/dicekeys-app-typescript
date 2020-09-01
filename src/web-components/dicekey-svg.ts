import * as SVG from "../dicekeys/svg";
import {
  Attributes,
  Component,
  Observable,
} from "../web-component-framework";
import {
  DiceKeyRenderOptions,
  renderDiceKey,  
} from "../dicekeys/render-to-svg";
import {
  DiceKey,
  PartialDiceKey
} from "../dicekeys/dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface DiceKeySvgOptions extends DiceKeyRenderOptions, Attributes {
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
export class DiceKeySvg extends Component<DiceKeySvgOptions, SVGSVGElement> {

  /**
   * The code supporting the demo page cannot run until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DiceKeySvgOptions
  ) {
    super(options, SVG.svg({}));
    // const sizeStr = this.size.toString();
    this.primaryElement.classList.add("dicekey-svg");

    this.primaryElement.addEventListener("click", () => {
      obscure.value = !obscure.value;
    }  );
    obscure.observe( this.renderSoon );
  }

  render() {
    super.render();
    const overlayMessage = this.options.overlayMessage ?? {
      message: "press to open box",
      fontFamily: "Sans-Serif",
      fontColor: "#00A000",
      fontWeight: 600,
    }
    renderDiceKey(this.primaryElement, this.options.diceKey, {...this.options, hide21: obscure.value, showLidTab: obscure.value});
    if (obscure.value && overlayMessage) {
      const {message, fontColor = "#000000", fontSizeAsFractionOfBoxSize = 1/12 , fontWeight = "normal", fontFamily = FontFamily} = overlayMessage;
      const fontSize = fontSizeAsFractionOfBoxSize * this.primaryElement.viewBox.baseVal.width;
      this.primaryElement.appendChild(SVG.text({
          x: 0, y: fontSize * 0.3,
          style: `text-anchor: middle; text-align: center; fill: ${fontColor}; font: ${ fontWeight } ${ fontSize }px ${ fontFamily }, monospace`
        },
        SVG.tspan(message)
       ));
      }
  }

};
