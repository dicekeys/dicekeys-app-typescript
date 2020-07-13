import {
//  Exceptions,
  DerivationOptions, ApiCalls, ApiStrings
} from "@dicekeys/dicekeys-api-js";
import {
  Attributes,
  HtmlComponent, Appendable
} from "./html-component";
import {
  areDerivationOptionsMutable, ProofOfPriorDerivationModule
} from "../api-handler/mutate-derivation-options"
import {
  DiceKey,
  DiceKeyInHumanReadableForm,
} from "../dicekeys/dicekey";
import {
  DiceKeyCanvas,
//  removeAllButCornerLettersFromDiceKey
} from "./dicekey-canvas";
import {
//  describeFrameOfReferenceForReallyBigNumber,
  describeHintPurpose
} from "../phrasing/api";
import { 
  Div,
  Label,
  TextInput,
  A,
  MonospaceSpan,
  Span,
  Checkbox,
  RadioButton
} from "./html-components";
import {
  DiceKeyAppState
} from "../state";
import {
  getRequestsDerivationOptionsJson
} from "../api-handler/get-requests-derivation-options-json";
import {
  ApiRequestContext, ConsentResponse
} from "../api-handler/handle-api-request";
import {
  executeApiRequestWithinWorker
} from "../workers/call-api-command-worker";

// We recommend you never write down your DiceKey (there are better ways to copy it)
// or read it over the phone (which you should never be asked to do), but if you
// had a legitimate reason to, removing orientations make it easier and mroe reliable.

// By removing orientnations from your DiceKey before generating a ___,
// your DiceKey will be more than a quadrillion
// (one million billion) times easier to guess, but the number of possible
// values will still be ... 

// This hint makes your DiceKey 303,600 easier to guess.  However, the number of possible
// guesses is still greater than ... .
// The hint does make it possible for others to know that you used the same  DcieKey for mutiple
// accounts.

export interface ApproveApiCommandOptions extends Attributes {
  requestContext: ApiRequestContext
  diceKey: DiceKey
}

export class ApproveApiCommand extends HtmlComponent<ApproveApiCommandOptions> {

  public readonly derivationOptionsInOriginalRequest: DerivationOptions;
  public modifiedDerivationOptions: DerivationOptions;
   
  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    private proofOfPriorDerivationModule: ProofOfPriorDerivationModule,
    options: ApproveApiCommandOptions
) {
    super(options);
    this.derivationOptionsInOriginalRequest = DerivationOptions(getRequestsDerivationOptionsJson(this.options.requestContext.request));
    this.modifiedDerivationOptions = {...this.derivationOptionsInOriginalRequest};
    this.restartApiCommandPrecomputation();
  }

  modifyDerivationOptions(newDerivationOptions: Partial<DerivationOptions>) {
    this.modifiedDerivationOptions = {...this.modifiedDerivationOptions, newDerivationOptions};
    this.restartApiCommandPrecomputation();
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

  private _wereRequestedDerivationOptionsUsedBefore?: boolean;
  protected get wereRequestedDerivationOptionsUsedBefore(): boolean {
    if (this._wereRequestedDerivationOptionsUsedBefore == null) {
      this._wereRequestedDerivationOptionsUsedBefore = this.proofOfPriorDerivationModule.verify(
        this.seedString, this.derivationOptionsInOriginalRequest
      );
    }
    return this._wereRequestedDerivationOptionsUsedBefore!;
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
  //   // ",000" for US factor of 3, ".000" for jurisdctions that use that.
  //   const zerosForThreeDecimalOrdersOfMagnitude = (1000).toLocaleString().substr(1);

  //   var strength = this.strength;
  //   const bits = Math.floor(Math.log2(strength));
  //   var decimal: string = "";
  //   while (strength > 1000000000) {
  //     strength /= 10000;
  //     decimal += zerosForThreeDecimalOrdersOfMagnitude;
  //   }
  //   decimal = Math.floor(strength).toLocaleString() + decimal;

  //   return `Attakers must guess from ${decimal} possible values (${bits.toLocaleString()} bits of strength)`;
  // }

  public get derivationOptionsMutable(): boolean { return areDerivationOptionsMutable(this.derivationOptionsInOriginalRequest); }

  public get finalDerivationOptionsJson(): string {
    if (!this.derivationOptionsMutable) {
      // We weren't allowed to mutate the derivatio options so leave them unchanged
      return getRequestsDerivationOptionsJson(this.options.requestContext.request)
    } else {
      return this.proofOfPriorDerivationModule.addToDerivationOptionsJson(this.seedString, this.modifiedDerivationOptions)
    }
  }

  hide21: boolean = true;
  private setDiceKeyCanvas = this.replaceableChild<DiceKeyCanvas>();

  public get mutatedRequest(): ApiCalls.RequestMessage {
    const { request } = this.options.requestContext;
    const derivationOptionsJson = this.finalDerivationOptionsJson;
    return "derivationOptionsJson" in request ?
      // replace the derivationOptionsJson field in the top level of the request
      {...request, derivationOptionsJson} :
      // replace the derivationOptionsJson field in the 
      {...request, packagedSealedMessage: {...request.packagedSealedMessage, derivationOptionsJson}}
  }

  public getResponseReturnUponUsersConsent = (): ConsentResponse => {
    const seedString = this.seedString;
    const mutatedRequest = this.mutatedRequest;
    return {
        seedString,
        mutatedRequest
    };
  }

  private cancelPrecomputationOfApiResult: (() => void) | undefined;
  #precomputedApiCommandResultPromise: Promise<ApiCalls.Response> | undefined;
  public precomputedResultOfApiCommand: ApiCalls.Response | undefined;
  private restartApiCommandPrecomputation = (): Promise<ApiCalls.Response> => {
    if (this.cancelPrecomputationOfApiResult) {
      this.cancelPrecomputationOfApiResult();
      this.#precomputedApiCommandResultPromise = undefined;
    }
    const {cancel, resultPromise} = executeApiRequestWithinWorker({
      seedString: this.seedString,
      request: this.mutatedRequest
    })
    this.cancelPrecomputationOfApiResult = cancel;
    this.#precomputedApiCommandResultPromise = resultPromise;
    resultPromise.then( (result) => {
      // Whenever we complete a computation, update the non-promised result and re-render
      this.precomputedResultOfApiCommand = result;
      this.renderSoon();
    });
    return resultPromise;
  }
  public get precomputedResultOfApiCommandPromise() { return this.#precomputedApiCommandResultPromise || this.restartApiCommandPrecomputation() }



  renderDiceKey = () => {
    if (!this.diceKey) {
      return;
    }
    const diceKeyCanvas = this.setDiceKeyCanvas(new DiceKeyCanvas({
      diceKey: this.modifiedDerivationOptions.excludeOrientationOfFaces ?
        DiceKey.removeOrientations(this.diceKey) :
        this.diceKey,
      diceBoxColor: "#000030",
      hide21: this.hide21,
      overlayMessage: {
        message: "press to open box",
        fontFamily: "Sans-Serif",
        fontColor: "#00A000",
        fontWeight: 600,
      }
    }));
    diceKeyCanvas.hide21Changed.on( (newHide21) => this.hide21 = newHide21 );
    return diceKeyCanvas;
  }

  handleOrientationCheckboxClicked = (excludeOrientationOfFaces: boolean) => {
    if (this.derivationOptionsMutable) {
      this.modifyDerivationOptions({excludeOrientationOfFaces: excludeOrientationOfFaces})
      this.renderDiceKey()
    }
  }

  render() {
    super.render();

    //var orientationCheckbox: Checkbox;
    this.append(
      Div({class: "dicekey-container"},
        this.renderDiceKey()
      )
    );
    if (this.derivationOptionsMutable) {
      this.append(
        Div({class: "orientation-widget"},
          Div({}, `Orientation of individual dice`),
          Label({}, RadioButton({name: "orientation", value: "preserve", checked: !this.modifiedDerivationOptions.excludeOrientationOfFaces}).with( r => r.clickedEvent.on( () => {
            this.modifiedDerivationOptions.excludeOrientationOfFaces = false;
            this.renderSoon();
          }) ), "Preserve"),
          Label({}, RadioButton({name: "orientation", value:"remove", checked: !!this.modifiedDerivationOptions.excludeOrientationOfFaces}).with( r => r.clickedEvent.on( () => {
            this.modifiedDerivationOptions.excludeOrientationOfFaces = true;
            this.renderSoon();
          })), "Remove")
        )
      );
    }
    this.append(
      Div({class: 'dicekey-preservation-instruction'},
        Span({text: `When you make your choice, the DiceKeys app will forget your DiceKey.  If you want to keep this app open and your DiceKey in memory, `}, '&nbsp;'),
        A({href: window.origin, target:"_blank"}).append(`open a new app tab`),
        `&nbsp;`,
        Span({text: ` first.`}),      
      ).withElement( div => {
        DiceKeyAppState.instance!.windowsOpen.changedEvent.onChangeAndInitialValue( () => {
          div.style.setProperty("visibility", DiceKeyAppState.instance!.windowsOpen.areThereOthers ? "hidden" : "visible")
        } );
      }),
    );
    var hintPurpose: Appendable | undefined;
    if (this.derivationOptionsMutable && (hintPurpose = describeHintPurpose(this.options.requestContext.request.command)) != null) {
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
              t.changedEvent.on( () => {
                this.modifyDerivationOptions({seedHint: t.value});
              })
            })
          )
        )
      );
    }
    if (this.options.requestContext.request.command === ApiStrings.Commands.getPassword &&
        this.precomputedResultOfApiCommand != null) {
      this.append(
        Div({}, `The password will be: ${(this.precomputedResultOfApiCommand as ApiCalls.GetPasswordResponse).password}`)
      )
    }


  }

}
