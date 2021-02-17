import style from "../demo.module.css";
import {
  UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Observable
} from "../../../web-component-framework";
import {
  ApiRequestWithSeedParameterNames,
} from "../../../workers/call-api-command-worker";
import {
  PrescribedTextFieldObservablesOrSpecification,
  PrescribedTextFieldObservables
} from "../../basic-building-blocks";


export interface MultiCommandSimulatorObservables {
  seedString: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  respondTo: PrescribedTextFieldObservablesOrSpecification<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  authorizedDomains: Observable<string[]>,
//  recipeJson: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.DerivationFunctionParameterNames.recipeJson>;
}
export interface MultiCommandSimulatorOptions extends Attributes<"div">, MultiCommandSimulatorObservables {}
export class MultiCommandSimulator<OPTIONS extends MultiCommandSimulatorOptions> extends Component<OPTIONS> {

  readonly seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  readonly respondTo: PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  authorizedDomains: Observable<string[]>;
//  readonly recipeJson: PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.recipeJson>;

  constructor(options: OPTIONS) {
    super({class: style.scenario_section, ...options});
    this.seedString = PrescribedTextFieldObservables.from(ApiRequestWithSeedParameterNames.seedString, options.seedString);
    this.respondTo = PrescribedTextFieldObservables.from(UrlRequestMetadataParameterNames.respondTo, options.respondTo);
    this.authorizedDomains = options.authorizedDomains;
//    this.recipeJson = PrescribedTextFieldObservables.from(ApiCalls.DerivationFunctionParameterNames.recipeJson, options.recipeJson);
  }
}
