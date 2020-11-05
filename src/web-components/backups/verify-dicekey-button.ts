import {
  Component,
  Attributes,
  ComponentEvent,
  Observable,
  Button
} from "../../web-component-framework";
import {
  DiceKey
} from "../../dicekeys/dicekey";
import {
  VerifyDiceKey
} from "./verify-dicekey";
import { Overlay } from "~web-components/basic-building-blocks/overlay";


interface VerifyDiceKeyOptions extends Attributes {
  diceKey: DiceKey;
}

/**
 * This class implements the component that displays DiceKeys.
 */
export class VerifyDiceKeyButton extends Component<VerifyDiceKeyOptions> {
 
  constructor(options: VerifyDiceKeyOptions) {
    super(options);
  }

  readonly result = new Observable<boolean | undefined>();
  readonly verificationInProgress = new Observable<boolean>(false).onChange( () => this.renderSoon() );

  readonly verifiedEvent = new ComponentEvent<[],this>(this);
  
  render() {
    super.render(
      this.verificationInProgress.value ?
        Overlay(
          new VerifyDiceKey({diceKey: this.options.diceKey}).with( e => {
            e.verifiedEvent.on( () => {
              this.result.set(true);
              this.verifiedEvent.send();
              this.verificationInProgress.set(false);
            });
            e.cancelledEvent.on( () => {
              this.result.set(false);
              this.verifiedEvent.send();
              this.verificationInProgress.set(false);
            });
          })
        )
      : this.result.value ?
        "Verified" :
        Button({events: events => events.click.on( () => {
          this.verificationInProgress.set(true);
        })}, "Verify")
    );
  }
}