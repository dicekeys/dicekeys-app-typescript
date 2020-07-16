import {
  Component, Attributes,
  ComponentEvent,
  InputButton, Div
} from "../web-component-framework";
import {
  DiceKeyCanvas
} from "./dicekey-canvas";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey";
import {
  DiceKey
} from "../dicekeys/dicekey";

interface DisplayDiceKeyCanvasOptions extends Attributes {
  diceKey: DiceKey;
  showOnlyCorners?: boolean;
}

/**
 * This class implements the component that displays DiceKeys.
 */
export class DisplayDiceKeyCanvas extends Component<DisplayDiceKeyCanvasOptions> {
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
  }

  render() {
    super.render();
    this.append(
      Div({class: "primary-container"},
        new DiceKeyCanvas({
          diceBoxColor: "#000010",
          diceKey: this.options.diceKey
        }),
        InputButton({
          value: "Forget DiceKey",
          events: (events) => events.click.on( () => {
            DiceKeyAppState.instance?.diceKey.remove();
            this.forgetEvent.send();
            this.remove();    
          })
        }),
      )
    );
  }


};
