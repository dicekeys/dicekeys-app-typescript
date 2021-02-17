import styles from "./display-dicekey.module.css";
import layoutStyles from "../layout.module.css";

import {
  Component, Attributes,
  ComponentEvent,
  InputButton, Div, Label, Select, Option, Observable,// OptGroup,
  TextInput
} from "../../web-component-framework";
import {
  DiceKeySvg
} from "./dicekey-svg";
import {
  EncryptedCrossTabState
} from "../../state/encrypted-cross-tab-state";
import {
  DiceKey
} from "../../dicekeys/dicekey";
import {
  getPasswordConsumers,
  // getPasswordConsumersGroupedByType,
  // PasswordConsumerType
} from "../../dicekeys/password-consumers";
import {
  ComputeApiCommandWorker
} from "../../workers/call-api-command-worker";
import {
    ApiCalls, Recipe
} from "@dicekeys/dicekeys-api-js";
import {
  DisplayPassword
} from "./password-field"
// import {
//   describePasswordConsumerType
// } from "../../phrasing/ui";
import { AddPasswordDomain } from "./add-password-domain";
import { PasswordJson } from "@dicekeys/seeded-crypto-js";
import { VerifyDiceKey } from "../backups/verify-dicekey";
import { CenteredControls } from "~web-components/basic-building-blocks";

interface DiceKeySvgViewOptions extends Attributes {
  diceKey: DiceKey;
  showOnlyCorners?: boolean;
}

const keyAddNewPassword = "add new password";

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

  recipeJson = new Observable<string>();
  password = new Observable<string>();

  showOnlyAddNewPasswordComponent = new Observable<boolean>(false).changedEvent.on( () => this.renderSoon() );
  showOnlyVerifyDiceKeyComponent = new Observable<boolean>(false).changedEvent.on( () => this.renderSoon() );

  // setPassword = (password: string) => {
  //   const pw = password ?? "";
  //   this.containerElement?.style.setProperty("visibility", pw.length > 0 ? "visible" : "hidden");
  //   if (this.passwordDivElement != null) {
  //     this.password.value = 
  //   }
  // }

  onPasswordManagerSelectChanged = async (passwordManagerName: string) => {
    if (passwordManagerName === keyAddNewPassword) {
      this.showOnlyAddNewPasswordComponent.value = true;
      this.renderSoon();
      return;
    }
    const selectedManager = getPasswordConsumers().find( pwmgr => pwmgr.name === passwordManagerName );
    if (selectedManager != null) {
      console.log("Selected password manager", selectedManager?.name);
      // Derive password in background then set it.
      const {recipe} = selectedManager;
      const seedString = DiceKey.toSeedString(this.options.diceKey, !Recipe(recipe).excludeOrientationOfFaces );
      this.recipeJson.set(recipe);
      const request: ApiCalls.GetPasswordRequest = {
        command: ApiCalls.Command.getPassword,
        recipe
      };
      console.log("Issuing request", seedString, request);
      const result = await DiceKeySvgView.computerPasswordRequestWorker.calculate({seedString, request});
      console.log("Calculation result", result);
      if ("exception" in result) {
        this.throwException(result.exception, "calculating a password");
      } else {
        this.password.value = (JSON.parse(result.passwordJson) as PasswordJson).password;
      }
    }
  }

  render() {
    super.render();
    if (this.showOnlyAddNewPasswordComponent.value) {
      this.append(new AddPasswordDomain({}).with( e => e.complete.on( () => {
          this.showOnlyAddNewPasswordComponent.value = false;
          this.renderSoon();
        }))
      )
      return;
    }
    if (this.showOnlyVerifyDiceKeyComponent.value) {
      this.append(
        new VerifyDiceKey({diceKey: this.options.diceKey}).with( e => {
          e.verifiedEvent.on( () => this.showOnlyVerifyDiceKeyComponent.set(false));
        })
      );
    } else {
      this.append(
        Div({class: layoutStyles.stretched_column_container},
          new DiceKeySvg({
            diceKey: this.options.diceKey,
            obscureByDefault: true,
          }),
          CenteredControls(
            Label({class: styles.create_password_for_label}, "Create a password for ",
              Select({value: "default"},
                Option({}),
                getPasswordConsumers().map( //([groupType, consumers]) => 
  //                OptGroup({label: describePasswordConsumerType(groupType)},
//                    ...consumers.map( pwm => 
                        ({name}) =>
                        Option({value: name},
                          name)
                  ),
//                    ...groupType !== PasswordConsumerType.UserEntered ? [] : [
                      Option({value: keyAddNewPassword}, "Add new")
//                    ]
//                  )
//                )
              ).with( select => {
                select.events.change.on( () => this.onPasswordManagerSelectChanged(select.primaryElement.value ))
              })
            )
          ),
          Div({class: layoutStyles.centered_column},
            TextInput({class: styles.recipe_input}).with( e => {
              this.recipeJson.observe( ( newRecipe => {
                e.primaryElement.style.setProperty("visibility", newRecipe && newRecipe.length > 0 ? "visible" : "hidden");
                e.value = newRecipe ?? "";
              })) 
            })
          ),
          Div({class: layoutStyles.centered_column, style: `visibility: hidden;`},
            new DisplayPassword({
              password: this.password,
              showCopyIcon: true
            }),
          ).withElement( e => {
            this.password.observe( (password =>
                e.style.setProperty("visibility", password && password.length > 0 ? "visible" : "hidden")
            ))
          }),
          CenteredControls(
            InputButton({
              value: "Verify Copy",
              events: (events) => events.click.on( () =>
                this.showOnlyVerifyDiceKeyComponent.set(true)
              )
            }),
            InputButton({
              value: "Forget",
              events: (events) => events.click.on( () => {
                EncryptedCrossTabState.instance?.forgetDiceKey();
                this.forgetEvent.send();
                this.remove();    
              })
            })
          ),
        )
      );
    }
  }

};
