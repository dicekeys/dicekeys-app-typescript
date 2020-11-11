import { DiceKey } from "~dicekeys/dicekey";
import { DiceKeyStateStore } from "~state/dicekey-state";
import { Attributes, Button, Checkbox, Component, ComponentEvent, Div, H2, Label, LI, Observable, OL } from "~web-component-framework";
import { Overlay } from "~web-components/basic-building-blocks/overlay";
import { ScanDiceKey } from "~web-components/reading-dicekeys/scan-dicekey";
import { ExpandableComponent } from "../basic-building-blocks";
import { CenteredControls } from "../basic-building-blocks";
import { DICEKEY, STICKEYS } from "../dicekey-styled";
import { VerifyDiceKeyButton } from "./verify-dicekey-button"
// import { EncryptedCrossTabState } from "~state";
// import { Instructions } from "./basic-building-blocks";


export interface BackupNudgeOptions extends Attributes<"div"> {
  diceKey: DiceKey;
  diceKeyState: DiceKeyStateStore;
}

export class BackupNudge extends Component<BackupNudgeOptions> {

  completedEvent = new ComponentEvent<[], this>(this);
  backupVerified = new Observable<boolean>(false);
  dontAskAgain = new Observable<boolean>(false);
  private dontAskAgainElement?: Label;
  private skipOrDoneButton?: Button;

  replicaCardExpanded = new Observable<boolean>(false);
  stickeysCardExpanded = new Observable<boolean>(false);

  handleReplicaVerified = () => {
    this.backupVerified.set(true);
    this.options.diceKeyState.hasBeenBackedUpToReplica.set(true);
    this.dontAskAgainElement?.primaryElement.style.setProperty('visibility', 'hidden');
    this.skipOrDoneButton!.primaryElement.textContent = "Done";
  }

  verifyReplica = () => {
    this.append(Overlay(
      new ScanDiceKey({})
    ))
  }

  handleSkipOrDoneButton = () => {
    if (this.dontAskAgain.value === true) {
      this.options.diceKeyState.dontAskAboutBackupAgain.value = true;
    }
    this.completedEvent.send();
  }

  constructor(options: BackupNudgeOptions) {
    super(options);
//    this.addClass(styles.);
  }

  render() {
    const {diceKey} = this.options;
//    const appState = await EncryptedCrossTabState.instancePromise;
//    const diceKeyState = appState.diceKeyState;
    super.render(
      new ExpandableComponent({expanded: this.stickeysCardExpanded},
        () => Div({},
          OL({},
            LI({}, `Take out your SticKey sheets`, // STICKEYS(),
              ` (or order some if you don't have any.)`
            ),
            LI({}, `Separate out the target sheet: the sheet which does not have stickers,
              but instead has a 5x5 grid of squares onto which to place stickers.
            `),
            LI({}, `
              For each die in your DiceKey, put the matching sticker at the same position and orientation on the target sheet.
            `) // Add illustration of sticker being placed onto target sheet
            ,
            LI({}, `Verify that the completed sheet matches your DiceKey.`, // DICEKEY(), `.`
            ),
            new VerifyDiceKeyButton({diceKey}).with( e => {
              e.verifiedEvent.on( this.handleReplicaVerified )
            }),
          )
        ),
        H2({}, `Create a replica using `, STICKEYS()),
      ),
      new ExpandableComponent({expanded: this.replicaCardExpanded},
        () => Div({},
          OL({},
            LI({}, `Take out your un-assembled DiceKey kit`, // STICKEYS(),
              ` (or order a new one.)`
            ),
            LI({}, `Into the bottom box, arrange the dice to match your current DiceKey.
            `),
            LI({}, `
              Before closing the box, verify that you have created a precise match.
            `)
            ,
            new VerifyDiceKeyButton({diceKey}).with( e => {
              e.verifiedEvent.on( this.handleReplicaVerified )
            }),
            LI({}, `Lock the DiceKey in place pressing the top and lid into place.`, // DICEKEY(), `.`
            )
          )
        ),
        H2({}, `Create a replica `, DICEKEY()),
      ),
      CenteredControls(
        Label({}, `Don't ask again`,
          Checkbox({events: (events) => events.click.on( () => this.dontAskAgain.value = ! this.dontAskAgain.value )})
        ).with( e => this.dontAskAgainElement = e ),
        Button({events: (events) => events.click.on( this.handleSkipOrDoneButton )
        }, "Skip").with( e => this.skipOrDoneButton = e ),
      )
    )
  }

}