import {
  ComponentEvent
} from "./component-event"
import {
  HtmlComponent
} from "./html-component";
import {
  DiceKeyCanvas,
  removeAllButCornerLettersFromDiceKey
} from "./dicekey-canvas";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey";
import {
  DiceKey
} from "../dicekeys/dicekey";

interface DisplayDiceKeyCanvasOptions {
  diceKey: DiceKey;
  showOnlyCorners?: boolean;
}

/**
 * This class implements the component that displays DiceKeys.
 */
export class DisplayDiceKeyCanvas extends HtmlComponent<DisplayDiceKeyCanvasOptions> {
  private static readonly forgetDiceKeyButtonId = "forget-dicekey-button";
  private static readonly toggleObscureButtonId = "toggle-obscure-state";
  protected get forgetDiceKeyButton() {
    return document.getElementById(DisplayDiceKeyCanvas.forgetDiceKeyButtonId) as HTMLButtonElement;
  }
  protected get toggleObscureButton() {
    return document.getElementById(DisplayDiceKeyCanvas.toggleObscureButtonId) as HTMLButtonElement;
  };
  private showOnlyCorners: boolean;
  
  //  private readonly diceKeyCanvas : DiceKeyCanvas;
  public forgetEvent = new ComponentEvent(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DisplayDiceKeyCanvasOptions
  ) {
    super(options);
    this.showOnlyCorners = !!this.options.showOnlyCorners;
  }

  private setDiceKeyCanvas = this.replaceableChild<DiceKeyCanvas>();
  renderDiceKeyCanvas = (): DiceKeyCanvas =>
    this.setDiceKeyCanvas(
      new DiceKeyCanvas({
        diceKey: this.showOnlyCorners ?
          removeAllButCornerLettersFromDiceKey(this.options.diceKey) :
          this.options.diceKey
      })
    );

  setShowOnlyCorners(showOnlyCorners: boolean) {
    this.showOnlyCorners = showOnlyCorners;
    this.toggleObscureButton.value = this.showOnlyCorners ? "Show" : "Hide";
    this.renderDiceKeyCanvas();
  }

  toggleObscureState = () => this.setShowOnlyCorners(!this.showOnlyCorners);

  render() {
    super.render();

    this.showOnlyCorners = !!this.options.showOnlyCorners;
    this.renderDiceKeyCanvas();
    this.appendHtml(`
      <input id="${DisplayDiceKeyCanvas.forgetDiceKeyButtonId}" type="button" value="Forget Dicekey"/>
      <input id="${DisplayDiceKeyCanvas.toggleObscureButtonId}" type="button" />
    `);
    
    this.toggleObscureButton?.addEventListener("click", this.toggleObscureState );
    
    this.forgetDiceKeyButton.addEventListener("click", () => {
      DiceKeyAppState.instance?.eraseDiceKey();
      this.forgetEvent.send();
      this.remove();
    });

  }


};
