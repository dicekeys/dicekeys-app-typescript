import {
  UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes
} from "../../web-component-framework";
import {
  ApiRequestWithSeedParameterNames,
} from "../../workers/call-api-command-worker";
import {
  DefaultPermittedPathPrefix
} from "../../api-handler/url-permission-checks";
import {
  derivationOptionsJsonForAllowedDomains
} from "../../dicekeys/derivation-options-json-for-allowed-domains";
import {
  PrescribedTextFieldSpecification,
  PrescribedTextFieldObservables,
  LabeledPrescribedTextInput
} from "../basic-building-blocks"
import {
  CommandSimulator
} from "./command-simulator";

interface ApiDemoOptions extends Attributes {
  seedString?: PrescribedTextFieldSpecification<string>;
}
export class ApiDemo extends Component<ApiDemoOptions> {
  
  domainOrCommaSeparatedDomains = new PrescribedTextFieldObservables<string, "domains">("domains", {
    prescribed: `${window.location.hostname}`
  });
  derivationOptionsJson = new PrescribedTextFieldObservables<string, "domains">("domains");
  seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;

  respondTo = new PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>(
    UrlRequestMetadataParameterNames.respondTo,
  )

  constructor(options: ApiDemoOptions) {
    super(options);
    this.seedString = new PrescribedTextFieldObservables(ApiRequestWithSeedParameterNames.seedString,
        {
          prescribed: new URL(window.location.href).searchParams.get(ApiRequestWithSeedParameterNames.seedString) ?? "Jenny: 867-5309", 
          ...options.seedString
        }
      );
    this.domainOrCommaSeparatedDomains.observable.observe( () => {
      this.derivationOptionsJson.prescribed.set(derivationOptionsJsonForAllowedDomains(this.domains));
      this.respondTo.prescribed.set(`${window.location.protocol}//${this.domains[0] ?? window.location.host}${DefaultPermittedPathPrefix}`)
    });
  }

  get domains(): string[] {
    return this.domainOrCommaSeparatedDomains.value
      .split(",")
      .map( domain => domain.trim() );
  }

  render() {
    super.render(
      new LabeledPrescribedTextInput(this.domainOrCommaSeparatedDomains, "Domain or domains (comma-separated) permitted to perform operations with the derived secrets:"),
      new LabeledPrescribedTextInput(this.seedString, "Seed:"),
      new LabeledPrescribedTextInput(this.respondTo, "Respond to:"),
      new LabeledPrescribedTextInput(this.derivationOptionsJson, "Derivation options:"),

      new CommandSimulator({
        onExceptionEvent: this.options.onExceptionEvent,
        seedString: {prescribed: this.seedString.observable},
        respondTo: {prescribed: this.respondTo.observable},
        derivationOptionsJson: {prescribed: this.derivationOptionsJson.observable}
      })
    );
  }

}