import styles from "./approve-api-command.module.css";
import layoutStyles from "../layout.module.css";

import {
//  Exceptions,
  DerivationOptions, ApiCalls, ApiStrings
} from "@dicekeys/dicekeys-api-js";
import {
  Attributes,
  Component, Appendable
} from "../../web-component-framework";
import {
  areDerivationOptionsMutable
} from "../../api-handler/mutate-derivation-options"
import {
  DiceKey,
  DiceKeyInHumanReadableForm,
} from "../../dicekeys/dicekey";
import {
  DiceKeySvg
} from "../display-dicekey/dicekey-svg";
import {
  DisplayPassword
} from "../display-dicekey/password-field";
import {
//  describeFrameOfReferenceForReallyBigNumber,
  describeHintPurpose, describeHost
} from "../../phrasing/api";
import { 
  Div,
  Label,
  TextInput,
//  A,
  Observable,
  MonospaceSpan,
  Span,
  Checkbox,
  RadioButton
} from "../../web-component-framework";
// import {
//   DiceKeyAppState
// } from "../../state";
import {
  getRequestsDerivationOptionsJson
} from "../../api-handler/get-requests-derivation-options-json";
import {
  ApiRequestContext, ConsentResponse
} from "../../api-handler/handle-api-request";
import {
  ComputeApiCommandWorker
} from "../../workers/call-api-command-worker";
import {
  AddDerivationOptionsProofWorker,
} from "../../workers/call-derivation-options-proof-worker";
import { jsonStringifyWithSortedFieldOrder } from "../../api-handler/json";


// We recommend you never write down your DiceKey (there are better ways to copy it)
// or read it over the phone (which you should never be asked to do), but if you
// had a legitimate reason to, removing orientations make it easier and more reliable.

// By removing orientations from your DiceKey before generating a ___,
// your DiceKey will be more than a quadrillion
// (one million billion) times easier to guess, but the number of possible
// values will still be ... 

// This hint makes your DiceKey 303,600 easier to guess.  However, the number of possible
// guesses is still greater than ... .
// The hint does make it possible for others to know that you used the same  DiceKey for multiple
// accounts.

export interface ApproveApiCommandOptions extends Attributes {
  requestContext: ApiRequestContext
  diceKey: DiceKey
}

export class ApproveApiCommand extends Component<ApproveApiCommandOptions> {

  private readonly derivationOptionsJsonInOriginalRequest: string;  
  private readonly areDerivationOptionsMutable: boolean;

  private modifiedDerivationOptions: DerivationOptions;
  
  private static readonly addDerivationOptionsProofWorker = new AddDerivationOptionsProofWorker();
  private static readonly computeApiCommandWorker = new ComputeApiCommandWorker();
 

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: ApproveApiCommandOptions
) {
    super(options);
    const derivationOptionsJson = getRequestsDerivationOptionsJson(this.options.requestContext.request);
    this.derivationOptionsJsonInOriginalRequest = derivationOptionsJson;
    this.areDerivationOptionsMutable = areDerivationOptionsMutable(this.derivationOptionsJsonInOriginalRequest);
    this.modifiedDerivationOptions = DerivationOptions(this.derivationOptionsJsonInOriginalRequest);
    // Kick of computation of initial values calculated by workers.
    const { request } = this.options.requestContext;
    const seedString = DiceKey.toSeedString(this.options.diceKey, this.modifiedDerivationOptions);
    ApproveApiCommand.computeApiCommandWorker.calculate({seedString, request});    // After this class is constructed, kick of background calculations.
    setTimeout( () => this.updateBackgroundOperationsForDerivationOptions(), 1);
    if ( request.command === ApiStrings.Commands.getPassword ) {
      (ApproveApiCommand.computeApiCommandWorker.resultPromise as Promise<ApiCalls.GetPasswordResponse>).then(
        precomputedResult => this.password.value = precomputedResult.password
      );
    }  
  }

  
  public getModifiedDerivationOptionsJson = async (): Promise<string> => {
    if (!this.areDerivationOptionsMutable) {
      // We weren't allowed to mutate the derivation options so leave them unchanged
      return this.derivationOptionsJsonInOriginalRequest
    } else {
      return (await ApproveApiCommand.addDerivationOptionsProofWorker.calculate({
        seedString: this.seedString,
        derivationOptionsJson: jsonStringifyWithSortedFieldOrder(this.modifiedDerivationOptions)
      })).derivationOptionsJson
    }
  }

  public getMutatedRequest = async (): Promise<ApiCalls.RequestMessage> => {
    const { request } = this.options.requestContext;
    const derivationOptionsJson = await this.getModifiedDerivationOptionsJson();
    return "derivationOptionsJson" in request ?
      // replace the derivationOptionsJson field in the top level of the request
      {...request, derivationOptionsJson} :
      // replace the derivationOptionsJson field in the 
      {...request, packagedSealedMessageFields: {...request.packagedSealedMessageFields, derivationOptionsJson}}
  }

  private updateBackgroundOperationsForDerivationOptions = async () => {
    await ApproveApiCommand.computeApiCommandWorker.calculate({seedString: this.seedString, request: await this.getMutatedRequest()});
    this.renderSoon();
  }

  modifyDerivationOptions(newDerivationOptions: Partial<DerivationOptions>) {
    this.updateBackgroundOperationsForDerivationOptions();
    if ("excludeOrientationOfFaces" in newDerivationOptions) {
      this.renderDiceKey();
    }
  }

  private get diceKey(): DiceKey {
    return DiceKey.applyDerivationOptions(this.options.diceKey, this.modifiedDerivationOptions);
  }

  private get seedString(): DiceKeyInHumanReadableForm {
    return DiceKey.toSeedString(this.options.diceKey, this.modifiedDerivationOptions);
  }


  private get cornerLettersClockwise(): string {
    const diceKey = this.diceKey;
    if (typeof diceKey === "undefined") {
      return "";
    }
    return DiceKey.cornerIndexesClockwise
      .map( index => diceKey[index].letter )
      .join("");
  }


  
  // private get strength(): number {
  //   const letterCount = 25; // FIXME - this.?.length || 0;
  //   var fromLetters = 1;
  //   for (var i=2; i <= letterCount; i++) fromLetters *= i;
  //   const fromDigits = 6 ** 25;
  //   const fromOrientations: number = 
  //     this.derivationOptions.excludeOrientationOfFaces ? 1 :
  //     4 ** 25;
  //   return fromLetters * fromDigits * fromOrientations;
  // }

  // private get strengthMessage(): string {
  //   // ",000" for US factor of 3, ".000" for jurisdictions that use that.
  //   const zerosForThreeDecimalOrdersOfMagnitude = (1000).toLocaleString().substr(1);

  //   var strength = this.strength;
  //   const bits = Math.floor(Math.log2(strength));
  //   var decimal: string = "";
  //   while (strength > 1000000000) {
  //     strength /= 10000;
  //     decimal += zerosForThreeDecimalOrdersOfMagnitude;
  //   }
  //   decimal = Math.floor(strength).toLocaleString() + decimal;

  //   return `Attackers must guess from ${decimal} possible values (${bits.toLocaleString()} bits of strength)`;
  // }

  password = new Observable<string>();
  obscurePassword = new Observable<boolean>(true);
  private setDiceKeySvg = this.replaceableChild<DiceKeySvg>();


  public getResponseReturnUponUsersConsent = async (): Promise<ConsentResponse> => {
    const seedString = this.seedString;
    const mutatedRequest = await this.getMutatedRequest();
    return {
        seedString,
        mutatedRequest
    };
  }


  renderDiceKey = () => {
    if (!this.diceKey) {
      return;
    }
    const diceKeySvg = this.setDiceKeySvg(new DiceKeySvg({
      diceKey: this.modifiedDerivationOptions.excludeOrientationOfFaces ?
        DiceKey.removeOrientations(this.diceKey) :
        this.diceKey,
      overlayMessage: {
        message: "press to open box",
        fontFamily: "Sans-Serif",
        fontColor: "#00A000",
        fontWeight: 600,
      }
    }));
    return diceKeySvg;
  }

  handleOrientationCheckboxClicked = (excludeOrientationOfFaces: boolean) => {
    if (this.areDerivationOptionsMutable) {
      this.modifyDerivationOptions({excludeOrientationOfFaces: excludeOrientationOfFaces})
      this.renderDiceKey()
    }
  }

  render() {
    super.render();
    this.addClass(layoutStyles.centered_column);

    //var orientationCheckbox: Checkbox;
    this.append(
      Div({class: styles.dicekey_container},
        this.renderDiceKey()
      )
    );
    if (this.areDerivationOptionsMutable) {
      this.append(
        Div({class: "orientation-widget"},
          Div({}, `Orientation of individual dice`),
          Label({}, RadioButton({name: "orientation", value: "preserve", checked: !this.modifiedDerivationOptions.excludeOrientationOfFaces}).with( r => r.events.click.on( () => {
            this.modifiedDerivationOptions.excludeOrientationOfFaces = false;
            this.renderSoon();
          }) ), "Preserve"),
          Label({},
            RadioButton({
                name: "orientation",
                value:"remove",
                checked: !!this.modifiedDerivationOptions.excludeOrientationOfFaces,
                events: (events) => {
                  events.click.on( () => {
                    this.modifiedDerivationOptions.excludeOrientationOfFaces = true;
                    this.renderSoon();
                  })
                }
              },
            ),
          "Remove",
          )
        )
      );
    }
    // this.append(
    //   Div({class: styles.dicekey_preservation_instruction},
    //     Span({text: `When you make your choice, the DiceKeys app will forget your DiceKey.  If you want to keep this app open and your DiceKey in memory, `}, '&nbsp;'),
    //     A({href: window.origin, target:"_blank"}).append(`open a new app tab`),
    //     `&nbsp;`,
    //     Span({text: ` first.`}),      
    //   ).withElement( div => {
    //     DiceKeyAppState.instance!.windowsOpen.changedEvent.onChangeAndInitialValue( () => {
    //       div.style.setProperty("visibility", DiceKeyAppState.instance!.windowsOpen.areThereOthers ? "hidden" : "visible")
    //     } );
    //   }),
    // );
    var hintPurpose: Appendable | undefined;
    if (this.areDerivationOptionsMutable && (hintPurpose = describeHintPurpose(this.options.requestContext.request.command)) != null) {
      var cornerCheckbox: Checkbox | undefined;
      var hintTextFieldLabel: Label | undefined;
      this.append(
        Div().append(
          Div().append(
            `Include hint(s) to help you find the same DiceKey to ${hintPurpose}.`
          ),
          Div().append(
            cornerCheckbox = Checkbox(),
            Label({for: cornerCheckbox?.primaryElementId}).append(
              `Include the corner letters of your DiceKey: `,
              MonospaceSpan({text: this.cornerLettersClockwise}),
              `.`
            ),
          ),
          Div().append(
            hintTextFieldLabel = Label().appendText(`Custom hint:`),
            TextInput().with( t => { 
              t.primaryElement.setAttribute("size", "60")
              hintTextFieldLabel?.primaryElement.setAttribute("for", t.primaryElementId)
              t.events.change.on( () => {
                this.modifyDerivationOptions({seedHint: t.value});
              })
            })
          )
        )
      );
    }
    if (this.options.requestContext.request.command === ApiStrings.Commands.getPassword) {
      this.append(
        Div({class: layoutStyles.centered_column},
          Div({class: styles.password_to_be_shared_label}, Span({},
            `password to be sent to&nbsp;`),
            describeHost(this.options.requestContext.host
          )),
          new DisplayPassword({
            password: this.password,
            obscurePassword: this.obscurePassword,
            showCopyIcon: true
          })
        ).withElement( e =>
          this.password.observe( (password) => e.style.setProperty("visibility",
            password ? "visible" : "hidden"
          ))
        )
      );
    }


  }


}
