import {
  Component,
  ComponentEvent,
  InputButton
} from "../web-component-framework"

export class HomeComponent extends Component {
  
  public readonly loadDiceKeyButtonClicked = new ComponentEvent<[MouseEvent]>(this);

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: {} = {},
  ) {
    super(options);
  }

  render() {
    super.render();
    this.append(
      InputButton({
        value: "Scan your DiceKey",
        events: (events) => {
          events.click.on( this.loadDiceKeyButtonClicked.send )
        }})
    );
  }

}
