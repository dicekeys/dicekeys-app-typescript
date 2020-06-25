import {
  HtmlComponent
} from "./html-component"
import {
  ComponentEvent
} from "./component-event";


export class HomeComponent extends HtmlComponent {
  static loadDiceKeyButtonId = "load-dice-key-button";
  private get loadDiceKeyButton(): HTMLButtonElement {
    return document.getElementById(HomeComponent.loadDiceKeyButtonId) as HTMLButtonElement;
  }

//  public static instance: HomeComponent | undefined;
  
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
    this.appendHtml(`
      <input id="${HomeComponent.loadDiceKeyButtonId}" type="button" value="Scan your DiceKey"/>
    `);
//    HomeComponent.instance = this;

    // Bind events
    this.loadDiceKeyButton.addEventListener("click", this.loadDiceKeyButtonClicked.send);
  }

}
