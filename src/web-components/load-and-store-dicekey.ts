import { Component, ComponentEvent } from "~web-component-framework";
import { EncryptedCrossTabState } from "~state";
import {
  LoadDiceKey, LoadDiceKeyOptions
} from "~/web-components/reading-dicekeys/load-dicekey";
import { BackupNudge } from "./backups/backup-nudge";
import { DiceKey } from "~dicekeys/dicekey";
import { ConfigureDiceKey } from "./configure-dicekey";


export interface LoadAndStoreDiceKeyOptions extends LoadDiceKeyOptions {
}


export class LoadAndStoreDiceKey extends Component<LoadAndStoreDiceKeyOptions> {

  cancelledEvent = new ComponentEvent<[], this>(this);
  completedEvent = new ComponentEvent<[DiceKey], this>(this);
  private backupStepComplete: boolean = false;

  constructor(options: LoadAndStoreDiceKeyOptions) {
    super({...options, class: undefined});
//    this.addClass(styles.EnterDiceKey);
  }


  async render() {
    const appState = await EncryptedCrossTabState.instancePromise;
    const diceKey = appState.diceKey;
    const diceKeyState = appState.diceKeyState;
    super.render();
    // This is a multi-step process, with different content rendered at each step.
    if (diceKey == null || diceKeyState == null) {
      // Step 1, load the DiceKey
      this.append(
        new LoadDiceKey({...this.options}).with( c => {
          c.loadedEvent.on( () => this.renderSoon() );
          c.cancelledEvent.on( () => this.cancelledEvent.send() );
        })
      );
//    } else if (!diceKeyState.nickname || diceKeyState.desiredPublicKeyCacheSize.value == undefined) {

    } else if (
      !this.backupStepComplete &&
      !diceKeyState.hasBeenBackedUpToReplica.value &&
      !diceKeyState.hasBeenBackedUpToWords.value &&
      !diceKeyState.dontAskAboutBackupAgain.value
    ) {
      // Encourage the user to make a backup.
      this.append(
        new BackupNudge({diceKey, diceKeyState}).with( e => {
          e.completedEvent.on( () => {
            this.backupStepComplete = true;
            this.renderSoon();
          });
        })
        // Instructions(`
        //   Make a replica using SticKeys.
        //   Make a replica DiceKey.
        //   Backup to words
        //   You have not yet made a backup of your DiceKey (at least, not using this app on this device).
        // `),
      )
    } else if (
      typeof diceKeyState.nickname === "undefined" ||
      typeof diceKeyState.desiredPublicKeyCacheSize.value === "undefined"
    ) {
      this.append(
        new ConfigureDiceKey({diceKey, diceKeyState}).with( e => {
          e.completedEvent.on( () => {
            this.renderSoon();
          })
       })
      )
    } else {
      this.completedEvent.send(appState.diceKey!);
      const desiredPublicKeyCacheSize = diceKeyState.desiredPublicKeyCacheSize.value;
      // FIXME - Should be moved to background worker (it could be slow!)
      //   on the other hand, web workers don't have access to storage, so we'd need a callback
      //   message handler.
      diceKeyState.populatePublicKeyCache(
        appState.seed!, {
          numberOfSealingKeysToStore: desiredPublicKeyCacheSize,
          numberOfSignatureVerificationKeysToStore: desiredPublicKeyCacheSize
        });
    }
  }

}

  //      this.renderHint();      

  // renderHint = () => {
  //   const {seedHint, cornerLetters} = this.options.derivationOptions || {};
  //   const {host} = this.options;

  //   this.append(
  //     Div({class: styles.scan_instruction}, `Use your camera to read your `, DICEKEY())
  //   )

  //   if (host && seedHint) {
  //     this.append(
  //       Div({class: styles.hint},
  //         "According to ",
  //         describeHost(host),
  //         ", you provided the following hint to identify your DiceKey: ",
  //         MonospaceSpan().setInnerText(seedHint)
  //       )
  //     );
  //   } else if (host && cornerLetters && cornerLetters.length === 4) {
  //     this.append(
  //       Div({class: styles.hint},
  //         "According to ",
  //         describeHost(host),
  //         ", you previously used a DiceKey with the letters ",
  //         MonospaceSpan().setInnerText(cornerLetters.substr(0, 3).split("").join(", ")),
  //         ", and ",
  //         MonospaceSpan().setInnerText(cornerLetters[3]),
  //         " at each corner."
  //       ),
  //     );
  //   }
  // }
