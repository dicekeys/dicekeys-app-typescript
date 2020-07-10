import {
//  Exceptions,
  DerivationOptions
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
  ApiCommandParameters,
} from "../api-handler/permission-checked-seed-accessor";
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

export interface ApiResponseSettingsOptions extends ApiCommandParameters, Attributes {
  diceKey: DiceKey
}

export class ApiResponseSettings extends HtmlComponent<ApiResponseSettingsOptions> {

  public readonly derivationOptions: DerivationOptions;

  private get diceKey(): DiceKey {
    return DiceKey.applyDerivationOptions(this.options.diceKey, this.derivationOptions);
  }

  private get seedString(): DiceKeyInHumanReadableForm {
    return DiceKey.toSeedString( this.diceKey, this.derivationOptions );
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

  public get derivationOptionsMutable(): boolean { return areDerivationOptionsMutable(this.derivationOptions); }

  private priorDerivationProvenCalculateOnlyOnce?: boolean;
  protected get priorDerivationProven(): boolean {
    if (this.seedString == null) {
      return false;
    } 
    if (this.priorDerivationProvenCalculateOnlyOnce == null) {
      this.priorDerivationProvenCalculateOnlyOnce = ProofOfPriorDerivationModule.instance?.verify(
        this.seedString, this.derivationOptions
      );
    }
    return this.priorDerivationProvenCalculateOnlyOnce!;
  }

  public get finalDerivationOptionsJson(): string {
    if (!this.derivationOptionsMutable || !ProofOfPriorDerivationModule.instance) {
      // We weren't allowed to mutate the derivatio options so leave them unchanged
      return this.options.derivationOptionsJson
    } else {
      return ProofOfPriorDerivationModule.instance.addToDerivationOptionsJson(this.seedString, this.derivationOptions)
    }
  }
 
  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: ApiResponseSettingsOptions
) {
    super(options);
    this.derivationOptions = DerivationOptions(this.options.derivationOptionsJson);
  }

  hide21: boolean = true;
  private setDiceKeyCanvas = this.replaceableChild<DiceKeyCanvas>();

  // animationTimeout: ReturnType<typeof setTimeout> | undefined;
  // animateCloseBox () => {
  //   this.animationTimeout = setTimeout
  // }

  renderDiceKey = () => {
//    const size = Math.min(window.innerWidth, window.innerHeight, 768);
    const diceKeyCanvas = this.setDiceKeyCanvas(new DiceKeyCanvas({
      diceKey: this.derivationOptions.excludeOrientationOfFaces ?
        DiceKey.removeOrientations(this.diceKey) :
        this.diceKey,
//      size,
      diceBoxColor: "#000030",
      hide21: this.hide21,
      overlayMessage: {
        message: "press to open box",
        fontFamily: "Sans-Serif",
        fontColor: "#00A000",
//        fontSize: size / 12,
        fontWeight: 600,
      }
    }));
    diceKeyCanvas.hide21Changed.on( (newHide21) => this.hide21 = newHide21 );
    return diceKeyCanvas;
  }

  handleOrientationCheckboxClicked = (excludeOrientationOfFaces: boolean) => {
    if (this.derivationOptionsMutable) {
      this.derivationOptions.excludeOrientationOfFaces = excludeOrientationOfFaces
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
          Label({}, RadioButton({name: "orientation", value: "preserve", checked: !this.derivationOptions.excludeOrientationOfFaces}).with( r => r.clickedEvent.on( () => {
            this.derivationOptions.excludeOrientationOfFaces = false;
            this.renderSoon();
          }) ), "Preserve"),
          Label({}, RadioButton({name: "orientation", value:"remove", checked: !!this.derivationOptions.excludeOrientationOfFaces}).with( r => r.clickedEvent.on( () => {
            this.derivationOptions.excludeOrientationOfFaces = true;
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
    if (this.derivationOptionsMutable && (hintPurpose = describeHintPurpose(this.options.command)) != null) {
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
                this.derivationOptions.seedHint = t.value;
              })
            })
          )
        )
      );
    }


  }

}
