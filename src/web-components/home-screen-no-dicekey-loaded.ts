import RenderedOpenDiceKey from "../images/RenderedOpenDiceKey.png";
import layoutStyles from "./layout.module.css";
import {
  Component,
  ComponentEvent,
  Button, Attributes, Img
} from "../web-component-framework";
import {
  DICEKEY
} from "./dicekey-styled";
import {
  appHasScannedADiceKeyBefore,
} from "~state";
import { LocalStorageField } from "~web-component-framework/locally-stored-state";

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
    if (!appHasScannedADiceKeyBefore && !hideTutorialForever.value) {
      this.append(
        // FIXME -- show link to assembly tutorial.

      )
    }
    this.append(
      Img({
        style: "max-width: 30vw; max-height: 30vh;",
        src: RenderedOpenDiceKey
      }),
      Button({
        events: (events) => {
          events.click.on( this.loadDiceKeyButtonClicked.send )
        }},
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
        style: "margin-top: 10vh;",
        events: (events) => {
          events.click.on( this.createRandomDiceKeyButtonClicked.send )
      }},
        "Create a Random ", DICEKEY(), " for Testing",
      ),
      
    );
  }

}
