import {
  ComponentEvent
} from "./component-event"
import {
  HtmlComponent
} from "./html-component";
import {
  DiceKeyCanvas, DiceKeyCanvasOptions
} from "./dicekey-canvas";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey";


/**
 * This class implements the component that displays DiceKeys.
 */
export class DisplayDiceKeyCanvas extends HtmlComponent<Partial<DiceKeyCanvasOptions>> {
  private static readonly forgetDiceKeyButtonId = "forget-dicekey-button";
  private static readonly toggleObscureButtonId = "toggle-obscure-state";
  protected get forgetDiceKeyButton() {
    return document.getElementById(DisplayDiceKeyCanvas.forgetDiceKeyButtonId) as HTMLButtonElement;
  }
  protected get toggleObscureButton() {
    return document.getElementById(DisplayDiceKeyCanvas.toggleObscureButtonId) as HTMLButtonElement;
  };
//  private readonly diceKeyCanvas : DiceKeyCanvas;
  public forgetEvent = new ComponentEvent(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: Partial<DiceKeyCanvasOptions> = {},
    parentComponent?: HtmlComponent
  ) {
    super(options, parentComponent);
  }

  render() {
    super.render();

    const diceKey = this.options.diceKey ?? DiceKeyAppState.instance?.diceKey!;
    const diceKeyCanvas = this.addChild(new DiceKeyCanvas({...this.options, diceKey}, this));
    this.addHtml(`
      <input id="${DisplayDiceKeyCanvas.forgetDiceKeyButtonId}" type="button" value="Forget Dicekey"/>
      <input id="${DisplayDiceKeyCanvas.toggleObscureButtonId}" type="button" />
    `);
    this.toggleObscureButton.value = diceKeyCanvas.obscure ? "Show" : "Hide";
    diceKeyCanvas.obscureStateChanged.on( obscure => {
      this.toggleObscureButton.value = obscure ? "Show" : "Hide"
    });
    
    this.toggleObscureButton?.addEventListener("click", diceKeyCanvas.toggleObscureState );
    
    this.forgetDiceKeyButton.addEventListener("click", () => {
      DiceKeyAppState.instance?.eraseDiceKey();
      this.forgetEvent.send();
      this.remove();
    });

  }


};
