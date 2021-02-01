import RenderedOpenDiceKey from "../images/RenderedOpenDiceKey.png";
import layoutStyles from "./layout.module.css";
import {
  Component,
  ComponentEvent,
  Button, Attributes, Img, Div, Span
} from "../web-component-framework";
import {
  DICEKEY
} from "./dicekey-styled";
import {
  appHasScannedADiceKeyBefore,
} from "~state";
import { LocalStorageField } from "~web-component-framework/locally-stored-state";
import { DiceKeySvg } from "./display-dicekey/dicekey-svg";
import { DiceKey } from "~dicekeys/dicekey";

interface HomeScreenOptions extends Attributes<"div"> {}

export const hideTutorialForever = new LocalStorageField<boolean>("HideTutorialForever");

export class HomeScreenForNoDiceKeyLoaded extends Component<HomeScreenOptions> {
  
  public readonly loadDiceKeyButtonClicked = new ComponentEvent<[MouseEvent]>(this);
  public readonly typeDiceKeyButtonClicked = new ComponentEvent<[MouseEvent]>(this);
  public readonly createRandomDiceKeyButtonClicked = new ComponentEvent<[MouseEvent]>(this);

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: HomeScreenOptions = {},
  ) {
    super(options);
    this.addClass(layoutStyles.centered_column);
  }

  render() {
    super.render();
    if (!appHasScannedADiceKeyBefore() && !hideTutorialForever.value) {
      this.append(
        // FIXME -- show link to assembly tutorial.
        Button({
            onClick: () => {},
            disabled: ""
          },
          "Order your DiceKey kit"
        ),
        Button({
            onClick: () => {},
            disabled: "",
          },
          "Assemble your DiceKey"
        ),
  
      )
    }
    this.append(
      Button({onClick: this.loadDiceKeyButtonClicked.send},
        Div({style: `display: flex; max-height: 20vh; margin-bottom: 1vh; flex-direction: row; justify-content: center; align-items: center;`},
          Img({
            style: "max-width: 20vw; max-height: 20vh;",
            src: RenderedOpenDiceKey
          }),
          Span({style: `font-size: 10vh; font-family: sans-serif;`},`&rarr;`),
          new DiceKeySvg({diceKey: DiceKey.fromRandom(), style: "max-height: 20vh; max-width: 20vh;"}),
        ),
        "Read in your ",
        DICEKEY() 
      ),
      // Button({
      //   style: "margin-top: 10vh;",
      //   events: (events) => {
      //     events.click.on( this.typeDiceKeyButtonClicked.send )
      //   }},
      //   "Type your ", DICEKEY()
      //   ),
      Button({
//        style: "margin-top: 10vh;",
        onClick: this.createRandomDiceKeyButtonClicked.send
      },
        "Create a Random ", DICEKEY(), " for Testing",
      ),
      
    );
  }

}
