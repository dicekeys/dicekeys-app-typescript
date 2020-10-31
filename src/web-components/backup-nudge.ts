import { Attributes, Component, ComponentEvent, Div, H2, LI, OL } from "~web-component-framework";
import { ExpandableComponent } from "./basic-building-blocks";
import { DICEKEY, STICKEYS } from "./dicekey-styled";
// import { EncryptedCrossTabState } from "~state";
// import { Instructions } from "./basic-building-blocks";


export interface BackupNudgeOptions extends Attributes<"div"> {
}

export class BackupNudge extends Component<BackupNudgeOptions> {

  cancelledEvent = new ComponentEvent<[], this>(this);
  completedEvent = new ComponentEvent<[], this>(this);

  constructor(options: BackupNudgeOptions) {
    super(options);
//    this.addClass(styles.);
  }

  async render() {
//    const appState = await EncryptedCrossTabState.instancePromise;
//    const diceKeyState = appState.diceKeyState;
    super.render(
      new ExpandableComponent({},
        () => Div({},
          OL({},
            LI({}, `Take out your SticKeys `, // STICKEYS(),
              ` (or order some if you don't have any.)`
            ),
            LI({}, `For each die, put the matching sticker at the same
              position and orientation on the target sheet.
            `)
            ,
            LI({}, `Verify that the completed sheet matches your DiceKey.`, // DICEKEY(), `.`
            )

          )
        ),
        H2({}, `Create a replica using `, STICKEYS()),
      ),
      H2({}, `Create a replica `, DICEKEY()),
    )
  }

}