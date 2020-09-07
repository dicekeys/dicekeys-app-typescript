import dialogStyles from "./dialog.module.css";
import layoutStyles from "./layout.module.css";

import {
  Component, Attributes,
  ComponentEvent,
  InputButton, Div, Label, Select, Option, Observable, OptGroup
} from "../web-component-framework";
import {
  DiceKeySvg
} from "./dicekey-svg";
import {
  EncryptedCrossTabState
} from "../state/encrypted-cross-tab-state";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  passwordConsumers,
  passwordConsumersGroupedByType
} from "../dicekeys/password-consumers";
import {
  ComputeApiCommandWorker
} from "../workers/call-api-command-worker";
import {
    ApiCalls, ApiStrings
} from "@dicekeys/dicekeys-api-js";
import {
  DisplayPassword
} from "./password-field"
import {
  describePasswordConsumerType
} from "../phrasing/ui";

interface DiceKeySvgViewOptions extends Attributes {
  diceKey: DiceKey;
  showOnlyCorners?: boolean;
}

/**
 * This class implements the component that displays DiceKeys.
 */
export class DiceKeySvgView extends Component<DiceKeySvgViewOptions> {
  private static readonly computerPasswordRequestWorker = new ComputeApiCommandWorker<ApiCalls.GetPasswordRequest>();

  public forgetEvent = new ComponentEvent(this);

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DiceKeySvgViewOptions
  ) {
    super(options);
  }

  containerElement?: HTMLDivElement;
  passwordDivElement?: HTMLDivElement;

  password = new Observable<string>();

  // setPassword = (password: string) => {
  //   const pw = password ?? "";
  //   this.containerElement?.style.setProperty("visibility", pw.length > 0 ? "visible" : "hidden");
  //   if (this.passwordDivElement != null) {
  //     this.password.value = 
  //   }
  // }

  onPasswordManagerSelectChanged = async (passwordManagerName: string) => {
    const selectedManager = passwordConsumers.find( pwmgr => pwmgr.name === passwordManagerName );
    if (selectedManager != null) {
      console.log("Selected password manager", selectedManager?.name);
      // Derive password in background then set it.
      const {derivationOptionsJson} = selectedManager;
      const seedString = DiceKey.toSeedString(this.options.diceKey, derivationOptionsJson);
      const request: ApiCalls.GetPasswordRequest = {
        command: ApiStrings.Commands.getPassword,
        derivationOptionsJson
      };
      console.log("Issuing request", seedString, request);
      const result = await DiceKeySvgView.computerPasswordRequestWorker.calculate({seedString, request});
      console.log("Calculation result", result);
      if (!("exception" in result)) {
        this.password.value = result.password;
      }
    }
  }

  render() {
    super.render();
    this.append(
      Div({class: "primary-container"},
        new DiceKeySvg({
          diceKey: this.options.diceKey
        }),
        Div({class: dialogStyles.centered_controls},
          Label({style: `margin-bottom: 4px;`}, "Create a password for ",
            Select({value: "default"},
              Option({}),
              passwordConsumersGroupedByType.map( group => 
                OptGroup({label: describePasswordConsumerType(group[0])},
                  group[1].map( pwm => Option({value: pwm.name}, pwm.name) )
                )
              )
            ).with( select => {
              select.events.change.on( () => this.onPasswordManagerSelectChanged(select.primaryElement.value ))
            })
          )
        ),
        Div({class: layoutStyles.centered_column, style: `visibility: hidden`},
          new DisplayPassword({
            password: this.password,
            showCopyIcon: true
          }),
        ).withElement( e => {
          this.password.observe( (password =>
              e.style.setProperty("visibility", password && password.length > 0 ? "visible" : "hidden")
          ))
        }),
        Div({class: dialogStyles.centered_controls},
          InputButton({
            value: "Forget DiceKey",
            events: (events) => events.click.on( () => {
              EncryptedCrossTabState.instance?.diceKey.remove();
              this.forgetEvent.send();
              this.remove();    
            })
          })
        ),
      )
    );
  }


};
