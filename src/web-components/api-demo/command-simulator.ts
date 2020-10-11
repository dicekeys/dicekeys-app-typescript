import {
  ApiCalls, UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Observable, Select, Option, Div
} from "../../web-component-framework";
import {
  ApiRequestWithSeedParameterNames,
  ComputeApiCommandWorker
} from "../../workers/call-api-command-worker";
import {
  getApiRequestFromSearchParams,
  addResponseToUrl,
} from "../../api-handler/handle-url-api-request";
import {
  PrescribedTextFieldObservablesOrSpecification,
  PrescribedTextFieldObservables,
  LabeledPrescribedTextInput
} from "../basic-building-blocks";


interface CommandSimulatorOptions<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> extends Attributes {
  command?: PrescribedTextFieldObservablesOrSpecification<COMMAND, typeof ApiCalls.RequestCommandParameterNames.command>;
  seedString?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  respondTo?: PrescribedTextFieldObservablesOrSpecification<string, typeof UrlRequestMetadataParameterNames.respondTo>;

  derivationOptionsJson?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;
  message?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.GenerateSignatureParameterNames.message>;
  plaintext?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext>;
  unsealingInstructions?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions>;
  packagedSealedMessageJson?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson>;

  requestId?: PrescribedTextFieldObservables<string, typeof ApiCalls.RequestMetadataParameterNames.requestId>;
  

  requestUrl?: PrescribedTextFieldObservablesOrSpecification<string>;


}


type KeysIncludingOptionalKeys<T> = T extends any ? keyof T : never;

export class CommandSimulator extends Component<CommandSimulatorOptions> {

  command: PrescribedTextFieldObservables<ApiCalls.Command, typeof ApiCalls.RequestCommandParameterNames.command>;
  seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  respondTo: PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>;

  derivationOptionsJson: PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;
  message: PrescribedTextFieldObservables<string, typeof ApiCalls.GenerateSignatureParameterNames.message>;
  plaintext: PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext>;
  unsealingInstructions: PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions>;
  packagedSealedMessageJson: PrescribedTextFieldObservables<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson>;

  requestId: PrescribedTextFieldObservables<string, typeof ApiCalls.RequestMetadataParameterNames.requestId>;
  requestUrl= new PrescribedTextFieldObservables<string, "requestUrl">("requestUrl");

  responseUrl = new Observable<string>();

  constructor(options: CommandSimulatorOptions) {
    super (options);
    this.command = PrescribedTextFieldObservables.from(ApiCalls.RequestCommandParameterNames.command, options.command);
    this.seedString = PrescribedTextFieldObservables.from(ApiRequestWithSeedParameterNames.seedString, options.seedString);
    this.respondTo = PrescribedTextFieldObservables.from(UrlRequestMetadataParameterNames.respondTo, options.respondTo);

    this.derivationOptionsJson = PrescribedTextFieldObservables.from(
      ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson, options.derivationOptionsJson
    );
    this.message = PrescribedTextFieldObservables.from(
      ApiCalls.GenerateSignatureParameterNames.message, options.message
    );
    this.plaintext = PrescribedTextFieldObservables.from(
      ApiCalls.SealWithSymmetricKeyParameterNames.plaintext, options.plaintext
    );
    this.unsealingInstructions = PrescribedTextFieldObservables.from(
      ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions, options.unsealingInstructions
    );
    this.packagedSealedMessageJson = PrescribedTextFieldObservables.from(
      ApiCalls.UnsealParameterNames.packagedSealedMessageJson, options.packagedSealedMessageJson
    );

    this.requestId = PrescribedTextFieldObservables.from(
      ApiCalls.RequestMetadataParameterNames.requestId, options.requestId
    );
    this.requestUrl = new PrescribedTextFieldObservables("requestUrl", options.requestUrl);
    this.requestUrl.prescribed.set( this.prescribedRequestUrl );
    for (const requestUrlShouldObserve of  [this.command, this.derivationOptionsJson, this.message, this.plaintext, this.unsealingInstructions, this.packagedSealedMessageJson, this.requestUrl] as const) {
      requestUrlShouldObserve.observable.onChange( () => this.requestUrl.prescribed.set( this.prescribedRequestUrl) );
    }
    this.requestUrl.observable.observe( () =>  this.processRequestUrl() );
    this.seedString.observable.onChange( () => this.processRequestUrl() )


  }

  get prescribedRequestUrl(): string {
    const url = new URL(`https://dicekeys.app/`);
    const command = this.command.observable.value;
    if (!command) return "";
    const parameters = [
      "command",
      "requestId",
      "respondTo",
      ...(Object.keys(ApiCalls.ParameterNames[command]) as (KeysIncludingOptionalKeys<ApiCalls.Parameters>)[])
    ] as const;
    for (const parameterName of parameters) {
      const parameterValue = this[parameterName].observable.value;
      if (parameterValue != null) {
        url.searchParams.append(parameterName, parameterValue);
      }
    }
    return url.toString();
  }

  updatePrescribedRequestUrl = () => {
    this.requestUrl.prescribed.set(this.prescribedRequestUrl);
  }

  processRequestUrl = async () => {
    const requestUrl = ( () => {
      try {
        return new URL(this.requestUrl.value ?? "");
      } catch {
        return;
      }
    })();
    if (!requestUrl) {
      return
    }
    const {searchParams} = requestUrl;
    const command = searchParams.get(ApiCalls.RequestCommandParameterNames.command) as ApiCalls.Command | null;
    if (command == null || !(command in ApiCalls.Command)) {
      return;
    }
    const request = getApiRequestFromSearchParams(requestUrl.searchParams);
    const respondTo = searchParams.get(UrlRequestMetadataParameterNames.respondTo);
    
    const seedString = this.seedString.value;
    if (seedString && request && respondTo) {
      try {
        const response = await new ComputeApiCommandWorker().calculate({seedString, request});
        const responseUrl = addResponseToUrl(command, respondTo, response);
        this.responseUrl.set(responseUrl);
      } catch (e) {
        this.responseUrl.set(e?.toString() ?? "Unknown exception")
      }
    }
  }


  get requiresDerivationOptionsJson(): boolean {
    const command = this.command.value;
    return !!command &&
      ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson in ApiCalls.ParameterNames[command];
  }

  get requiresMessage(): boolean { return this.command.value === ApiCalls.Command.sealWithSymmetricKey };
  get requiresPackagedSealedMessage(): boolean {
    return this.command.value === ApiCalls.Command.unsealWithUnsealingKey ||
           this.command.value === ApiCalls.Command.unsealWithSymmetricKey;
  }
  get requiresClientMayRetrieveKey(): boolean {
    return !!this.command.value && ApiCalls.commandRequiresDerivationOptionOfClientMayRetrieveKey(this.command.value);
  }

  commandHasParameter = (parameterName: string): boolean =>
    !!this.command.value && parameterName in ApiCalls.ParameterNames[this.command.value];

  appendPrescribedTextInputIfParameterOfCommand = (
    parameter: PrescribedTextFieldObservables<string, string>
  ): void => {
    if (this.commandHasParameter(parameter.name)) {
      this.append( new LabeledPrescribedTextInput(parameter, `${parameter.name}`) )
    }
  }

  render() {
    super.render();
    if (this.command.forceUsePrescribed) {

    } else {
      this.append(
        Select({value: this.command.value},
          Option({}, ""),
          ...ApiCalls.Commands.map( command => Option({value: command, ...(command === this.command.value ? {selected: ""} : {})}, command) )
        ).with( select => select.events.change.on( () => {
          this.command.set(select.primaryElement.value as ApiCalls.Command);
          this.renderSoon();
        }))
      );
    }
    this.appendPrescribedTextInputIfParameterOfCommand(this.seedString);
    this.appendPrescribedTextInputIfParameterOfCommand(this.requestUrl);
    this.appendPrescribedTextInputIfParameterOfCommand(this.requestId);

    this.appendPrescribedTextInputIfParameterOfCommand(this.derivationOptionsJson);
    this.appendPrescribedTextInputIfParameterOfCommand(this.message);
    this.appendPrescribedTextInputIfParameterOfCommand(this.plaintext);
    this.appendPrescribedTextInputIfParameterOfCommand(this.unsealingInstructions);
    this.appendPrescribedTextInputIfParameterOfCommand(this.packagedSealedMessageJson);

    this.append(
      new LabeledPrescribedTextInput(this.requestUrl, "Request URL:"),
      Div({},
        Div({}, "Response:"),
        Div({}).withElement( e => this.responseUrl.observe( (newResponseUrl) => e.textContent = newResponseUrl ?? "" ))  
      )
    )
  }

}
