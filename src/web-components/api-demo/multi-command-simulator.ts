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
  PrescribedTextFieldObservables,
//  LabeledPrescribedTextInput
} from "../basic-building-blocks";
import { CommandSimulator } from "./command-simulator";
import { Formula, FormulaInputVariable } from "./formula";


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

  packagedSealedMessage = new Observable<string>();

  render() {
    const baseOptions = {
      authorizedDomains: this.options.authorizedDomains,
      seedString: this.seedString,
      respondTo: this.respondTo,
    }
    super.render(
      new CommandSimulator({
        command: "sealWithSymmetricKey",
        ...baseOptions,
        seededCryptoObjectAsJson: this.packagedSealedMessage
//        derivationOptionsJson: this.derivationOptionsJson,
      }),
      new CommandSimulator({
        command: "unsealWithSymmetricKey",
        packagedSealedMessageJson: {
          formula: Formula("packagedSealedMessage", FormulaInputVariable({}, "seededCryptoObjectAsJson"), " (returned by sealWithSymmetricKey"),
          prescribed: this.packagedSealedMessage,
          usePrescribed: true
        },
        ...baseOptions
      }),
    );
  }

}