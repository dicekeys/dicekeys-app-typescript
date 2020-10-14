import style from "../demo.module.css";
import {
  Observable, Div
} from "../../../web-component-framework";
import {
  PrescribedTextFieldObservables, PrescribedTextInput
//  LabeledPrescribedTextInput
} from "../../basic-building-blocks";
import { CommandSimulator } from "../command-simulator";
import { FnCall, Formula, FormulaInputVariable, Instructions, ParameterCard, ResultTextBlock } from "../basic-api-demo-components";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import {
  MultiCommandSimulatorOptions,
  MultiCommandSimulator
} from "./multi-command-simulator";


interface SealAndUnsealOptions extends MultiCommandSimulatorOptions {
  useGlobalKey?: boolean
}
export class SealAndUnseal extends MultiCommandSimulator<SealAndUnsealOptions> {

  sealingKeyJson = new Observable<string>();
  plaintext = new Observable<string>("Easy as API!");
  packagedSealedMessageJson = new Observable<string>();

  constructor(options: MultiCommandSimulatorOptions) {
    super(options);
    this.sealMessages();
  }

  seal = async () => {
    try {
      const sealingKeyJson = this.sealingKeyJson.value;
      if (!sealingKeyJson) return;
      const plaintext = this.plaintext.value;
      if (!plaintext) return;
      const sealingKey = (await SeededCryptoModulePromise).SealingKey.fromJson(sealingKeyJson);
      try {
        const packagedSealedMessage = sealingKey.seal(plaintext);
        this.packagedSealedMessageJson.set( packagedSealedMessage.toJson() );
        packagedSealedMessage.delete();
      } finally {
        sealingKey.delete();
      }
    } catch {}
  }

  sealMessages = async () => {
    this.sealingKeyJson.observe( () => this.seal() );
    this.plaintext.observe( () => this.seal() );
  }

  render() {
    const baseInputs = {
      ...(this.options.useGlobalKey ? {} : {authorizedDomains: this.options.authorizedDomains}),
      seedString: this.seedString,
      respondTo: this.respondTo,
    }
    super.render(
      new CommandSimulator({
        command: "getSealingKey",
        inputs: {
          ...baseInputs
        },
        outputs: {
          sealingKeyJson: this.sealingKeyJson
        }
      }),
      Div({class: style.operation_card},
        Div({class: style.operation_card_title}, `SeededCryptoLibrary::SealingKey::seal`),
        ParameterCard({},
          Instructions("You will encrypt the following message locally using the seeded cryptography library."),
          new PrescribedTextInput({observables: PrescribedTextFieldObservables.from("plaintext", {
            formula: Formula("plaintext", "string | byte[]"),
            actual: this.plaintext
          })}),
        ),
        ParameterCard({},
          Formula("packagedSealedMessageJson", "string",
            "SealingKey.",
            FnCall("fromJson"),
            "(", FormulaInputVariable({},"sealingKeyJson"), ")",
            ".", FnCall("seal"), "(", FormulaInputVariable({}, "plaintext"), ")",
          ),
          ResultTextBlock({}).updateFromObservable( this.packagedSealedMessageJson )
        ),  
      ),
      new CommandSimulator({
        command: "unsealWithUnsealingKey",
        inputs: {
          packagedSealedMessageJson: {
            formula: Formula("packagedSealedMessageJson", "string"),
            prescribed: this.packagedSealedMessageJson
          },
          ...baseInputs
        }
      }),
    );
  }
}
