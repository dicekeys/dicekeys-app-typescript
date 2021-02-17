//import layoutStyles from "./layout.module.css";
import styles from "./load-dicekey.module.css";

import { Attributes, Button, Component, ComponentEvent, Observable } from "~web-component-framework";
import {
  ScanDiceKey
} from "./scan-dicekey";
import {
  EnterDiceKey
} from "./enter-dicekey"
import { DiceKey, ReadOnlyTupleOf25Items } from "~dicekeys/dicekey";
import { EncryptedCrossTabState } from "~state";
import { ObservablePartialFace } from "~dicekeys/partial-dicekey";
import { CenteredControls } from "~/web-components/basic-building-blocks";


type Mode = "camera" | "manual";

export interface LoadDiceKeyOptions extends Attributes<"div"> {
  showCancelButton?: boolean;
  showChangeModeButton?: boolean;
  mode?: Mode | Observable<Mode>;
}

export class LoadDiceKey extends Component<LoadDiceKeyOptions> {

  mode: Observable<Mode>;

  cancelledEvent = new ComponentEvent<[], this>(this);
  loadedEvent = new ComponentEvent<[DiceKey, Mode], this>(this);

  constructor(options: LoadDiceKeyOptions) {
    super(options);
    this.addClass(styles.LoadDiceKey);
    const {
      mode = new Observable<Mode>("camera") 
    } = options;
    this.mode = typeof mode === "string" ? new Observable(mode) : mode;
    this.mode.onChange( () =>
      this.renderSoon()
    );
  }

  toggleMode = () => this.mode.set( this.mode.value === "camera" ? "manual" : "camera" );

  protected completeLoad = (diceKey: DiceKey, mode: Mode) => {
    const appState = EncryptedCrossTabState.instance!;
    // Remove any observables and use a pure Face now that the DiceKey is final.
    diceKey = diceKey?.map( ({letter, digit, orientationAsLowercaseLetterTrbl}) =>
      ({letter, digit, orientationAsLowercaseLetterTrbl}) ) as DiceKey;
    appState.diceKey = diceKey;
    if (mode === "camera") {
      appState.diceKeyState?.hasBeenReadWithoutError.set(true);
    }
    this.loadedEvent.send(diceKey, mode);
  }

  protected readonly partialDiceKey: ReadOnlyTupleOf25Items<ObservablePartialFace> = Array.from({length: 25}, () => new ObservablePartialFace({orientationAsLowercaseLetterTrbl: 't'})) as ReadOnlyTupleOf25Items<ObservablePartialFace>;
  protected readonly isValid = new Observable<boolean>(false);


  render() {
    const {
      showCancelButton = true,
      showChangeModeButton = true,
      ...options
    } = this.options;
    const showOptionsButtons = showCancelButton || showChangeModeButton;
    super.render(
      (
        (this.mode.value === "camera") ?
          new ScanDiceKey(options).with( e => e.diceKeyReadEvent.on( diceKey => this.completeLoad(diceKey, "camera") )) :
          new EnterDiceKey({...options,
            partialDiceKey: this.partialDiceKey,
            isValid: this.isValid,
            showButtons: false
          }).with( e =>
            e.diceKeyEnteredEvent.on( diceKey => this.completeLoad(diceKey, "manual") )
          )
      ),
      ...(showOptionsButtons ? [
        CenteredControls(
          ...(showCancelButton ? [
            Button({
              events: (events) => events.click.on( () => {
                this.cancelledEvent.send();
                this.remove();
              })
            }, "Cancel")
          ] : []),
          ...(showChangeModeButton ? [
            Button({
              events: e => e.click.on( this.toggleMode )
            },
            this.mode.value === "camera" ? "Enter Manually" : "Scan with Camera"
            )
          ] : []),
          ...(this.mode.value === "manual" ? [
              Button({
                  events: events => events.click.on( () => {
                    if (DiceKey.validate(this.partialDiceKey)) {
                      this.completeLoad(this.partialDiceKey, "manual");
                    }
                  })
                },
                `Done`,
              ).withElement( button => {
                // The button should only be visible in manual entry mode
                this.mode.observe( (mode) =>
                  button.style.setProperty("visibility", mode === "manual" ? "visible" : "hidden") );
                // The button should be disabled unless the key is valid.
                this.isValid.observe( (valid) => button.disabled = !valid );
              })
            ]: []
          )
        ),
      ] : []),
    );
  }
}
