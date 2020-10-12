import {
  ApiCalls, UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes
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


export interface MultiCommandSimulatorObservables {
  seedString: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  respondTo: PrescribedTextFieldObservablesOrSpecification<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  derivationOptionsJson: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;
}
export interface MultiCommandSimulatorOptions extends Attributes<"div">, MultiCommandSimulatorObservables {}
export class MultiCommandSimulator<OPTIONS extends MultiCommandSimulatorOptions> extends Component<OPTIONS> {

  readonly seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  readonly respondTo: PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  readonly derivationOptionsJson: PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;

  constructor(options: OPTIONS) {
    super(options);
    this.seedString = PrescribedTextFieldObservables.from(ApiRequestWithSeedParameterNames.seedString, options.seedString);
    this.respondTo = PrescribedTextFieldObservables.from(UrlRequestMetadataParameterNames.respondTo, options.respondTo);
    this.derivationOptionsJson = PrescribedTextFieldObservables.from(ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson, options.derivationOptionsJson);
  }
}

export class SymmetricKeySimulator extends MultiCommandSimulator<MultiCommandSimulatorOptions> {

  render() {
    const baseOptions = {
      seedString: this.seedString,
      respondTo: this.respondTo,
    }
    super.render(
      new CommandSimulator({
        command: "sealWithSymmetricKey",
        ...baseOptions,
        derivationOptionsJson: this.derivationOptionsJson,
      }),
      new CommandSimulator({
        command: "unsealWithSymmetricKey",
        ...baseOptions
      }),
    );
  }

}