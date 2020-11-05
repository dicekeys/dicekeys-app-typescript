import layoutStyles from "../layout.module.css";
import {
  Component, Attributes,
  ComponentEvent,
  Div, Observable, Button
} from "../../web-component-framework";
import {
  DiceKey
} from "../../dicekeys/dicekey";
import {
  ScanDiceKey
} from "../scanning/scan-dicekey";
import { Face } from "@dicekeys/read-dicekey-js";
import { CenteredControls } from "~web-components/basic-building-blocks";


interface VerifyDiceKeyOptions extends Attributes {
  diceKey: DiceKey;
}

interface FaceError {
  index: number;
  location: keyof Face;
}

const keysOfFace: (keyof Face)[] = ["letter", "digit", "orientationAsLowercaseLetterTrbl"];

const getErrorsForSingleRotation = (referenceDiceKey: DiceKey, diceKeyToTest: DiceKey): FaceError[] => {
  const errors = [] as FaceError[];
  for (var index=0; index < referenceDiceKey.length; index++) {
    const r = referenceDiceKey[index];
    const t = diceKeyToTest[index];
    for (const keyOfFace of keysOfFace) {
      if (r[keyOfFace] !== t[keyOfFace]) {
        errors.push({index, location: keyOfFace});
      }
    }
  }
  return errors;
}

const getErrors = (referenceDiceKey: DiceKey, diceKeyToTest: DiceKey): FaceError[] => {
  var errors = getErrorsForSingleRotation(referenceDiceKey, diceKeyToTest);
  for (const turn of [1,2,3] as const) {
    const rotatedTestKey = DiceKey.rotate(diceKeyToTest, turn);
    const errorsRotated = getErrorsForSingleRotation(referenceDiceKey, rotatedTestKey);
    if (errorsRotated.length < errors.length) {
      errors = errorsRotated;
    }
  }
  return errors;
}

/**
 * This class implements the component that displays DiceKeys.
 */
export class VerifyDiceKey extends Component<VerifyDiceKeyOptions> {
 
  constructor(options: VerifyDiceKeyOptions) {
    super(options);
    this.addClass(layoutStyles.centered_column);
  }

  readonly diceKeyScanned = new Observable<DiceKey | undefined>().changedEvent.on( (diceKeyScanned) => {
    this.errors.set( diceKeyScanned ? getErrors(this.options.diceKey, diceKeyScanned) : undefined )
  });
  errors = new Observable<FaceError[] | undefined>();


  handleDiceKeyRead = (diceKey: DiceKey) => {
    const errors = getErrors(this.options.diceKey, diceKey);
    if (errors.length === 0) {
      this.verifiedEvent.send();
    } else {
      this.diceKeyScanned.set(diceKey);
      this.errors.set( getErrors(this.options.diceKey, diceKey) )
      this.renderSoon();
    }
  }

  readonly cancelledEvent = new ComponentEvent<[FaceError[]], this>(this);
  readonly verifiedEvent = new ComponentEvent<[], this>(this);

  render() {
    super.render(
      (!this.diceKeyScanned.value) ? [
          "Scan the replica of your DiceKey",
          new ScanDiceKey({}).with( e => {
            e.diceKeyReadEvent.on( this.handleDiceKeyRead )
          }),
        ]
      :
        [
          (this.errors.value!.length > 12)  ?
            Div({text: `The scanned key looks nothing like the key to be backed up.`})
          :
            Div({},
              this.errors.value!.map( ({location, index}) => Div(
                {text: `Incorrect ${
                  location === "orientationAsLowercaseLetterTrbl" ? "orientation" :
                  location === "letter" ? "letter" :
                  location === "digit" ? "digit" : ""
                } for the face that was ${
                  this.options.diceKey[index].letter + this.options.diceKey[index].digit
                } in the key being backed up.`}
              )) 
            )
          ],
      CenteredControls(
        Button({
          events: e => e.click.on( () => this.cancelledEvent.send(this.errors.value ?? []) )
        }, "Cancel"),
        this.diceKeyScanned.value ?
          Button({
              ...( this.diceKeyScanned.value ? {} : {style: `display: none`}),
              events: (events) => events.click.on( () => {
                this.errors.set(undefined);
                this.diceKeyScanned.set(undefined);
                this.renderSoon();
              })
            }, "Scan again"
          )
          : undefined
      ),
    );
  }
}