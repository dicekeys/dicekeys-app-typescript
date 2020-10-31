// import style from "../demo.module.css";
import {
  Observable
} from "../../../web-component-framework";
import {
  Instructions,
  PrescribedTextFieldObservables, PrescribedTextInput
//  LabeledPrescribedTextInput
} from "../../basic-building-blocks";
import { CommandSimulator } from "../command-simulator";
import { FnCall, Formula, InputVar, OperationCard, ParameterCard, ResultTextBlock, TemplateInputVar } from "../basic-api-demo-components";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import {
  MultiCommandSimulatorOptions,
  MultiCommandSimulator
} from "./multi-command-simulator";
import { ApiCalls } from "@dicekeys/dicekeys-api-js";
import { restrictionsJson } from "~dicekeys/restrictions-json";


interface SealAndUnsealOptions extends MultiCommandSimulatorOptions {
  useGlobalKey?: boolean
}
export class SealAndUnseal extends MultiCommandSimulator<SealAndUnsealOptions> {

  sealingKeyJson = new Observable<string | undefined>();
  plaintext = new Observable<string>("Easy as API!");
  packagedSealedMessageJson = new Observable<string>();

  private unsealingInstructions = PrescribedTextFieldObservables.from(
    ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions, {
      formula: Formula("unsealingInstructions", "string", `'{"allow":[{"host":"*.`, TemplateInputVar("authorizedDomains[i]"), `"}]}'`)
    }
  );

  constructor(options: SealAndUnsealOptions) {
    super(options);
    this.sealingKeyJson.observe( () => this.seal() );
    this.plaintext.observe( () => this.seal() );
    this.authorizedDomains.observe( domains => domains && domains.length > 0 &&
      this.unsealingInstructions.prescribed.set(restrictionsJson(domains))
    );
  }

  seal = async () => {
    try {
      const sealingKeyJson = this.sealingKeyJson.value;
      if (!sealingKeyJson) return;
      const plaintext = this.plaintext.value;
      if (!plaintext) return;
      const sealingKey = (await SeededCryptoModulePromise).SealingKey.fromJson(sealingKeyJson);
      try {
        const packagedSealedMessage = sealingKey.sealWithInstructions(plaintext, this.unsealingInstructions.value ?? "");
        this.packagedSealedMessageJson.set( packagedSealedMessage.toJson() );
        packagedSealedMessage.delete();
      } finally {
        sealingKey.delete();
      }
    } catch {}
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
        getGlobalSealingKey: this.options.useGlobalKey,
        inputs: {
          ...baseInputs
        },
        outputs: {
          sealingKeyJson: this.sealingKeyJson
        }
      }),
      OperationCard(`SeededCryptoLibrary::SealingKey::seal`,
        ParameterCard(
          Instructions("You will encrypt the following message locally using the seeded cryptography library."),
          new PrescribedTextInput({observables: PrescribedTextFieldObservables.from("plaintext", {
            formula: Formula("plaintext", "string | byte[]"),
            actual: this.plaintext
          })}),
        ),
        ...(this.options.useGlobalKey ? [
          ParameterCard(
            Instructions(`Since any application or service can ask the DiceKeys app to use a key with no restrictions
              in its derivation options, we place the restrictions in the the unsealingInstructions that are attached
              to the sealed message.`),
            new PrescribedTextInput({observables: this.unsealingInstructions}),
          )
          ] : []
        ),
        ParameterCard(
          Formula("packagedSealedMessageJson", "string",
            "SealingKey.",
            FnCall("fromJson", InputVar("sealingKeyJson")),
            ".",
            FnCall("seal", InputVar("plaintext"), this.options.useGlobalKey ? [ ", ", InputVar("unsealingInstructions") ] : [] ),
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
