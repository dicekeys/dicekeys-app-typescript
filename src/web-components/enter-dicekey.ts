import dialogStyles from "./dialog.module.css";
import layoutStyles from "./layout.module.css";
import styles from "./enter-dicekey.module.css";
import {
  Attributes,
  Button,
  Component,
  ComponentEvent,
  Div,
  Observable,
} from "../web-component-framework";
import {
  DiceKeyRenderOptions
} from "../dicekeys/render-to-svg";
import {
  DiceKey,
  ReadOnlyTupleOf25Items,
} from "../dicekeys/dicekey";
import { Face, FaceDigit, FaceLetter, FaceOrientationLetterTrblOrUnknown } from "@dicekeys/read-dicekey-js";
import { DiceKeySvg } from "./display-dicekey/dicekey-svg";
import { ObservablePartialFace } from "~dicekeys/partial-dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";


export interface EnterDiceKeyOptions extends DiceKeyRenderOptions, Attributes {
  partialDiceKey?: ReadOnlyTupleOf25Items<ObservablePartialFace>;
  isValid?: Observable<boolean>;
  showButtons?: boolean
}

// export class ObservablePartialFace implements Partial<Face> {
//   readonly letterField: Observable<FaceLetter | undefined>;
//   readonly digitField: Observable<FaceDigit | undefined>;
//   readonly orientationAsLowercaseLetterTrblField: Observable<FaceOrientationLetterTrbl | undefined>;

//   get letter() { return this.letterField.value }
//   set letter(letter: FaceLetter | undefined) { this.letterField.set(letter) }

//   get digit() { return this.digitField.value }
//   set digit(digit: FaceDigit | undefined) { this.digitField.set(digit) }

//   get orientationAsLowercaseLetterTrbl() { return this.orientationAsLowercaseLetterTrblField.value }
//   set orientationAsLowercaseLetterTrbl(orientationAsLowercaseLetterTrbl: FaceOrientationLetterTrbl | undefined) { this.orientationAsLowercaseLetterTrblField.set(orientationAsLowercaseLetterTrbl) }

//   constructor(partialFace: Partial<Face>) {
//     this.letterField = new Observable<FaceLetter | undefined>(partialFace.letter);
//     this.digitField = new Observable<FaceDigit | undefined>(partialFace.digit);
//     const orientationAsLowercaseLetterTrbl = partialFace.orientationAsLowercaseLetterTrbl == "?" ? undefined : partialFace.orientationAsLowercaseLetterTrbl;
//     this.orientationAsLowercaseLetterTrblField = new Observable<FaceOrientationLetterTrbl | undefined>(orientationAsLowercaseLetterTrbl);
//   }
// }

// export type ObservablePartialDiceKey = TupleOf25Items<ObservablePartialFace>;

/**
 * This class implements the component that allows manual entry of DiceKeys.
 */
export class EnterDiceKey extends Component<EnterDiceKeyOptions> {

  
  // Events

  /**
   * This event is triggered when the DiceKey has been been scanned
   * successfully.
   */
  public readonly diceKeyEnteredEvent = new ComponentEvent<[DiceKey], this>(this);
  public readonly cancelledEvent = new ComponentEvent<[], this>(this);

  readonly currentFaceIndex = new Observable<number | undefined>(0);

  readonly isValid: Observable<boolean>;

  protected validate = () => { this.isValid.set( DiceKey.validate(this.partialDiceKey) ) }

  get diceKey() {
    return (DiceKey.validate(this.partialDiceKey)) ? this.partialDiceKey : undefined;
  }

  readonly partialDiceKey: ReadOnlyTupleOf25Items<ObservablePartialFace>;

  /**
   * The code supporting the demo page cannot run until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: EnterDiceKeyOptions
  ) {
    super(options);
    this.addClass(layoutStyles.stretched_column_container);
    this.isValid = options.isValid ?? new Observable<boolean>(false);
    this.partialDiceKey = options.partialDiceKey ?? Array.from({length: 25}, () => new ObservablePartialFace({orientationAsLowercaseLetterTrbl: 't'})) as ReadOnlyTupleOf25Items<ObservablePartialFace>
    // const sizeStr = this.size.toString();
    document.addEventListener("keydown", this.keyDownListener);
  }

  render() {
    super.render();
    this.append(
      new DiceKeySvg({...this.options, diceKey: this.partialDiceKey, highlightDieAtIndex: this.currentFaceIndex}),
      Div({
        class: styles.key_hints,
        text: `To rotate the current face, use either < >, - +, or CTRL arrow (right and left arrows).`
      }),
      ...(this.options.showButtons ? [
        Div({class: dialogStyles.decision_button_container},
          Button({events: e => e.click.on( () => this.cancelledEvent.send())},
            "Cancel"
          ),
          Button({
            events: events => events.click.on( () => {
              const diceKey = this.diceKey;
              if (diceKey) {
                this.diceKeyEnteredEvent.send(diceKey);
              }
            })},
            `Done`
          ).withElement( button => this.isValid.observe( (valid) =>
            button.style.setProperty("visibility", valid ? "visible" : "hidden")
          ))
        )]: []
      )
    );
  }

  remove() {
    if (!super.remove()) {
      return false;
    }
    document.removeEventListener("keydown", this.keyDownListener);
    return true;
  }

  private get currentFace(): Partial<Face> { return this.partialDiceKey![this.currentFaceIndex.value!]; }
  private get previousFaceIndex(): number { return (this.currentFaceIndex.value! + 24) % 25; }
  private get nextFaceIndex(): number { return (this.currentFaceIndex.value! + 1) % 25; }
  private get nextFace(): Partial<Face> { return this.partialDiceKey[this.nextFaceIndex]; }


  keyDownListener = (event: KeyboardEvent) => {
    const upperKey = event.key.toUpperCase();
    if (FaceLetter.isValid(upperKey)) {
      if (this.currentFace.letter != null && this.currentFace.digit != null && this.nextFace.letter == null) {
        this.currentFaceIndex.set(this.nextFaceIndex);
      }
      this.currentFace.letter = upperKey;
    } else if (FaceDigit.isValid(upperKey)) {
      if (this.currentFace.letter != null && this.currentFace.digit != null && this.nextFace.digit == null) {
        this.currentFaceIndex.set( this.nextFaceIndex);
      }
      this.currentFace.digit = upperKey;
    } else if (
      ((event.shiftKey || event.ctrlKey) && event.code === "ArrowRight") ||
      event.key === "+" ||
      event.key === "=" ||
      event.key === "]" ||
      event.key === "." ||
      event.key === ">" ||
      event.key === "'"
    ) {
      // Rotate right
      this.currentFace.orientationAsLowercaseLetterTrbl =
        FaceOrientationLetterTrblOrUnknown.rotate(this.currentFace.orientationAsLowercaseLetterTrbl ?? 't', 1) ?? 't';      
    } else if (
      ( (event.shiftKey || event.ctrlKey) && event.code === "ArrowLeft") ||
      event.key === "_" ||
      event.key === "-" ||
      event.key === "[" ||
      event.key === "," ||
      event.key === "<" ||
      event.key === ";"
    ) {
      // Rotate left
      this.currentFace.orientationAsLowercaseLetterTrbl =
        FaceOrientationLetterTrblOrUnknown.rotate(this.currentFace.orientationAsLowercaseLetterTrbl ?? 't', 3) ?? 't';
    } else if (event.code === "ArrowUp") {
      // Move up ( index -= 5 % 25 )
      this.currentFaceIndex.value = ( this.currentFaceIndex.value! + 20 ) % 25;
    } else if (event.code === "ArrowDown") {
      // Move down ( index += 5 % 25 )
      this.currentFaceIndex.value = ( this.currentFaceIndex.value! + 5 ) % 25;
    } else if (event.code === "ArrowLeft" || ((event.shiftKey || event.ctrlKey) && (event.code === "Tab" || event.code === "Space"))) {
      // Move left
      this.currentFaceIndex.value = this.previousFaceIndex;
    } else if (event.code === "ArrowRight" || ((!event.shiftKey && !event.ctrlKey) && (event.code === "Tab" || event.code === "Space"))) {
      // Move right
      this.currentFaceIndex.value = this.nextFaceIndex;
    } else if (event.code === "Delete") {
      delete this.currentFace.letter;
      delete this.currentFace.digit;
      this.currentFace.orientationAsLowercaseLetterTrbl = 't';
    } else if (event.code === "Backspace") {
      if (this.currentFace.letter == null && this.currentFace.digit == null) {
        this.currentFaceIndex.value = this.previousFaceIndex;
      } else {
        delete this.currentFace.letter;
        delete this.currentFace.digit;
        this.currentFace.orientationAsLowercaseLetterTrbl = 't';
      }
    } else if (event.code === "Home") {
      this.currentFaceIndex.value = 0;
    } else if (event.code === "End") {
      this.currentFaceIndex.value = 24;
    } else {
      // No key found.  Do nothing and allow (DO NOT prevent) default
      return;
    }
    this.validate();
    event.preventDefault();
  }

};
