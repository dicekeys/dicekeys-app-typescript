import dialogStyles from "../dialog.module.css";
import layoutStyles from "../layout.module.css";

import {
  Component, Attributes,
  ComponentEvent,
  InputButton, Div, Observable
} from "../../web-component-framework";
import {
  DiceKey
} from "../../dicekeys/dicekey";
import {
  ScanDiceKey
} from "../scanning/scan-dicekey";
import { Face } from "@dicekeys/read-dicekey-js";


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
export class VerifyDicekey extends Component<VerifyDiceKeyOptions> {
 
  constructor(options: VerifyDiceKeyOptions) {
    super(options);
    this.addClass(layoutStyles.centered_column);
  }

  readonly diceKeyScanned = new Observable<DiceKey | undefined>().changedEvent.on( this.renderSoon );
  readonly doneEvent = new ComponentEvent<[], this>(this);

  

  get errorList(): FaceError[] {
    return this.diceKeyScanned.value ?
      getErrors(this.options.diceKey, this.diceKeyScanned.value) :
      []
  }

  render() {
    super.render();
    if (!this.diceKeyScanned.value) {
      // The dice key has not been scanned
      this.append(
        new ScanDiceKey({}).with( e => {
          e.diceKeyLoadedEvent.on( this.diceKeyScanned.set );
        }),
      )
    } else {
      const errors = this.errorList;
      if (errors.length === 0) {
        // Report perfect replica
        this.append(
          Div({text: `Perfect Match!`})
        )
      } if (errors.length > 12) {
        // Report that the two keys look nothing alike
        this.append(
          Div({text: `Those don't look at all alike!`})
        );
      } else {
        // Report out each error
        this.append(
          Div({},
            errors.map( ({location, index}) => Div(
              {text: `Incorrect ${
                location === "orientationAsLowercaseLetterTrbl" ? "orientation" :
                location === "letter" ? "letter" :
                location === "digit" ? "digit" : ""
              } for the face that was ${
                this.options.diceKey[index].letter + this.options.diceKey[index].digit
              } in your reference DiceKey`}
            )) 
          )
        );
      }
    }
    this.append(
      Div({class: dialogStyles.decision_button_container},
        InputButton({
          value: `Scan again`,
          ...( this.diceKeyScanned.value ? {} : {style: `display: none`}),
          events: (events) => events.click.on( () => this.diceKeyScanned.set(undefined))
        }),
        InputButton({
          value: `Done`,
          events: e => e.click.on( () => this.doneEvent.send() )
        })
      )
    );
  }
}