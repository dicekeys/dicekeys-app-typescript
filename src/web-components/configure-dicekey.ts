import { DiceKey, FaceInHumanReadableForm } from "~dicekeys/dicekey";
import { DiceKeyStateStore } from "~state/stores/dicekey-state";
import { Attributes, Button, Component, ComponentEvent, Observable } from "~web-component-framework";
import { ObservableTextInput, ObservableTextInputOptions } from "./basic-building-blocks";
import { FormCard, InputCard, LabelAboveLeft } from "./basic-building-blocks";
import { CenteredControls } from "./basic-building-blocks";

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
    if (typeof diceKeyState.centerDieHumanReadableForm === "undefined" || diceKeyState.centerDieHumanReadableForm.value?.length == 0) {
      diceKeyState.centerDieHumanReadableForm.set( FaceInHumanReadableForm(diceKey[12]) )
    }

    // if (typeof diceKeyState.nickname === "undefined") {
    //   diceKeyState.nickname = `DiceKey with corners ${
    //     diceKey[0].letter + diceKey[4].letter + diceKey[20].letter + diceKey[24].letter
    //   } first entered on ${new Date().toLocaleString()}`
    // }
//    this.addClass(styles.);
  }

  render() {
    super.render(
      FormCard(
        // InputCard(
        //   LabelAboveLeft("Your nickname for this DiceKey", 
        //     new ObservableTextInput({
        //       style: `width: 50em;`,
        //       observable: this.options.diceKeyState.nicknameField
        //     } as ObservableTextInputOptions),
        //   ),
        // ),
        InputCard(
          LabelAboveLeft("Number of public keys to store in the app", 
            new ObservableTextInput({
              style: `width: 4em;`,
              observable: this.desiredPublicKeyCacheSizeStringField
            } as ObservableTextInputOptions),
          ),
        ),
      ),
      CenteredControls(
        Button({events: (events) => events.click.on( this.completedEvent.send  )
        }, "Continue"),
      )
    )
  }

}