import { DiceKey } from "~dicekeys/dicekey";
import { DiceKeyStateStore } from "~state/dicekey-state";
import { Attributes, Button, Component, ComponentEvent, Label, Observable } from "~web-component-framework";
import { ObservableTextInput, ObservableTextInputOptions } from "./basic-building-blocks";
import { CenteredControls } from "./basic-building-blocks/dialog";

export interface ConfigureDiceKeyOptions extends Attributes<"div"> {
  diceKey: DiceKey;
  diceKeyState: DiceKeyStateStore;
}

const defaultDesiredPublicKeyCacheSize = 20;

export class ConfigureDiceKey extends Component<ConfigureDiceKeyOptions> {

  completedEvent = new ComponentEvent<[], this>(this);

  private readonly desiredPublicKeyCacheSizeStringField = new Observable<string>(
    (this.options.diceKeyState.desiredPublicKeyCacheSize.value ?? defaultDesiredPublicKeyCacheSize).toString() 
  ).observe( (newValue) => {
    const desiredPublicKeyCacheSize = parseInt(newValue ?? "", 10);
    if (!isNaN(desiredPublicKeyCacheSize)) {
      this.options.diceKeyState.desiredPublicKeyCacheSize.set(desiredPublicKeyCacheSize);
    }
  })


  constructor(options: ConfigureDiceKeyOptions) {
    super(options);
    const {diceKey, diceKeyState} = this.options;
    if (typeof diceKeyState.nickname === "undefined") {
      diceKeyState.nickname = `DiceKey with corners ${
        diceKey[0].letter + diceKey[4].letter + diceKey[20].letter + diceKey[24].letter
      } first entered on ${new Date().toLocaleString()}`
    }
//    this.addClass(styles.);
  }

  render() {
    super.render(
      Label({}, "Your nickname for this DiceKey", 
        new ObservableTextInput({
          observable: this.options.diceKeyState.nicknameField
        } as ObservableTextInputOptions),
      ),
      Label({}, "Number of public keys to store in the app", 
        new ObservableTextInput({
          observable: this.desiredPublicKeyCacheSizeStringField
        } as ObservableTextInputOptions),
      ),
      CenteredControls(
        Button({events: (events) => events.click.on( this.completedEvent.send  )
        }, "Continue"),
      )
    )
  }

}