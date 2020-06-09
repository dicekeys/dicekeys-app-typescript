import {
  HtmlComponent,
  HtmlComponentConstructorOptions,
  HtmlComponentOptions
} from "./html-component"
import {
  ReadDiceKey
} from "./read-dicekey";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey"

export var loadDiceKeyPromise: Promise<DiceKey> | undefined;
export const loadDiceKeyAsync = async (): Promise<DiceKey> => {
  var diceKey = (await DiceKeyAppState.instancePromise).diceKey;
  if (!diceKey) {
    if (!loadDiceKeyPromise) {
      loadDiceKeyPromise = new Promise( (resolve, reject) => {
        new ReadDiceKey({parentElement: document.body}).attach()
          .diceKeyLoadedEvent.on( (diceKey) => {
             DiceKeyAppState.instance!.diceKey = diceKey;
             resolve(diceKey);
          })
          .userCancelledEvent.on( () => reject( 
            new Error("No DiceKey read")
          ))
      });
      loadDiceKeyPromise.finally( () => { loadDiceKeyPromise = undefined; } )
      HomeComponent.instance?.detach();
    }
    return await loadDiceKeyPromise;
  }
  return diceKey!;
}

export class HomeComponent extends HtmlComponent {
  static loadDiceKeyButtonId = "load-dice-key-button";
  private loadDiceKeyButton: HTMLButtonElement | undefined;

  public static instance: HomeComponent | undefined;
  
  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  private constructor(
    options: HtmlComponentConstructorOptions = {}
  ) {
    super({...options,
      html: `
      <input id="${HomeComponent.loadDiceKeyButtonId}" type="button" value="Scan your DiceKey"/>
    `});
    HomeComponent.instance = this;
  }

  attach(options: HtmlComponentOptions = {}) {
    super.attach(options);
    // Bind to HTML
    this.loadDiceKeyButton = document.getElementById(HomeComponent.loadDiceKeyButtonId) as HTMLButtonElement;

    this.loadDiceKeyButton.addEventListener("click", () => {
      loadDiceKeyAsync();
    });
    return this;
  }

  public static create(
    options: HtmlComponentConstructorOptions = {}
  ): HomeComponent {
    if (HomeComponent.instance) {
      return HomeComponent.instance;
    } else {
      HomeComponent.instance = new HomeComponent(options);
      return HomeComponent.instance;
    }
  }

  public static attach(
    options: HtmlComponentConstructorOptions = {}
  ): HomeComponent {
    HomeComponent.create(options);
    HomeComponent.instance?.attach();
    return HomeComponent.instance!;
  }


}
