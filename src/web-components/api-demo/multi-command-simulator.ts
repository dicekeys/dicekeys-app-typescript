import {
  UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Observable
} from "../../web-component-framework";
import {
  ApiRequestWithSeedParameterNames,
} from "../../workers/call-api-command-worker";
import {
  PrescribedTextFieldObservablesOrSpecification,
  PrescribedTextFieldObservables, PrescribedTextInput
//  LabeledPrescribedTextInput
} from "../basic-building-blocks";
import { CommandSimulator } from "./command-simulator";
import { FnCall, Formula, FormulaInputVariable, Instructions, ParameterCard } from "./basic-api-demo-components";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";


export interface MultiCommandSimulatorObservables {
  seedString: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  respondTo: PrescribedTextFieldObservablesOrSpecification<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  authorizedDomains: Observable<string[]>,
//  derivationOptionsJson: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;
}
export interface MultiCommandSimulatorOptions extends Attributes<"div">, MultiCommandSimulatorObservables {}
export class MultiCommandSimulator<OPTIONS extends MultiCommandSimulatorOptions> extends Component<OPTIONS> {

  readonly seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  readonly respondTo: PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  authorizedDomains: Observable<string[]>;
//  readonly derivationOptionsJson: PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;

  constructor(options: OPTIONS) {
    super(options);
    this.seedString = PrescribedTextFieldObservables.from(ApiRequestWithSeedParameterNames.seedString, options.seedString);
    this.respondTo = PrescribedTextFieldObservables.from(UrlRequestMetadataParameterNames.respondTo, options.respondTo);
    this.authorizedDomains = options.authorizedDomains;
//    this.derivationOptionsJson = PrescribedTextFieldObservables.from(ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson, options.derivationOptionsJson);
  }
}

export class SymmetricKeySealAndUnseal extends MultiCommandSimulator<MultiCommandSimulatorOptions> {
  packagedSealedMessageJson = new Observable<string>();

  render() {
    const baseInputs = {
      authorizedDomains: this.options.authorizedDomains,
      seedString: this.seedString,
      respondTo: this.respondTo,
    }
    super.render(
      new CommandSimulator({
        command: "sealWithSymmetricKey",
        inputs: {
          ...baseInputs
        },
        outputs: {
          packagedSealedMessageJson: this.packagedSealedMessageJson
        }
      }),
      new CommandSimulator({
        command: "unsealWithSymmetricKey",
        inputs: {
          packagedSealedMessageJson: {
            formula: Formula("packagedSealedMessageJson", "string"),//, FormulaInputVariable({}, "packagedSealedMessage"), "(returned by sealWithSymmetricKey"),
            prescribed: this.packagedSealedMessageJson,
            usePrescribed: true
          },
          ...baseInputs
        }
      }),
    );
  }
}


export class SealAndUnseal extends MultiCommandSimulator<MultiCommandSimulatorOptions> {

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
      authorizedDomains: this.options.authorizedDomains,
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
      ParameterCard({},
        Instructions("You will encrypt the following message locally using the seeded cryptography library."),
        new PrescribedTextInput({observables: PrescribedTextFieldObservables.from("plaintext", {
          formula: Formula("plaintext", "string | byte[]"),
          actual: this.plaintext
        })}),
      ),
      new CommandSimulator({
        command: "unsealWithUnsealingKey",
        inputs: {
          packagedSealedMessageJson: {
            formula: Formula("packagedSealedMessageJson", "string",
              "SealingKey.",
              FnCall("fromJson"),
              "(", FormulaInputVariable({},"sealingKeyJson"), ")",
              ".", FnCall("seal"), "(", FormulaInputVariable({}, "plaintext"), ")",
              ),
            prescribed: this.packagedSealedMessageJson
          },
          ...baseInputs
        }
      }),
    );
  }
}
