import {
  ApiCalls, stringToUtf8ByteArray, UrlRequestMetadataParameterNames, urlSafeBase64Encode
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Observable, Div, Pre, Appendable
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
import { jsonStringifyWithSortedFieldOrder } from "~api-handler/json";
import { ParameterNames } from "@dicekeys/dicekeys-api-js/dist/api-calls";


interface CommandSimulatorOptions<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> extends Attributes<"div"> {
  command: COMMAND;
  seedString?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  respondTo?: PrescribedTextFieldObservablesOrSpecification<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  requestId?: PrescribedTextFieldObservables<string, typeof ApiCalls.RequestMetadataParameterNames.requestId>;

//  derivationOptionsJson?:  PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;
  derivationOptionsJson?: typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson extends keyof typeof ParameterNames[COMMAND] ?
    PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson> :
    never;
  message?: COMMAND extends typeof ApiCalls.Command.generateSignature ? 
    PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.GenerateSignatureParameterNames.message> :
    never;
  plaintext?: COMMAND extends (typeof ApiCalls.Command.sealWithSymmetricKey) ?
    PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext> :
    never;
  unsealingInstructions?: COMMAND extends (typeof ApiCalls.Command.sealWithSymmetricKey) ?
    PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions> :
    never;
  packagedSealedMessageJson?: COMMAND extends (typeof ApiCalls.Command.unsealWithSymmetricKey | typeof ApiCalls.Command.unsealWithUnsealingKey) ?
    PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson> :
    never;
  

  requestUrl?: PrescribedTextFieldObservablesOrSpecification<string>;
}


type KeysIncludingOptionalKeys<T> = T extends any ? keyof T : never;

// export SealAndUnsealCommandSimulator


export class CommandSimulator<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> extends Component<CommandSimulatorOptions<COMMAND>> {

  readonly command: COMMAND;
  readonly seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  readonly respondTo: PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>;

  readonly derivationOptionsJson: typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson extends keyof typeof ParameterNames[COMMAND] ?
    PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson> :
    never;
  
  message: COMMAND extends typeof ApiCalls.Command.generateSignature ?
    PrescribedTextFieldObservables<string, typeof ApiCalls.GenerateSignatureParameterNames.message> : never;

  messageBase64: COMMAND extends typeof ApiCalls.Command.generateSignature ?
    PrescribedTextFieldObservables<string, typeof ApiCalls.GenerateSignatureParameterNames.message> : never;

  plaintext: COMMAND extends typeof ApiCalls.Command.sealWithSymmetricKey ?
    PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext> : never;

  plaintextBase64: COMMAND extends typeof ApiCalls.Command.sealWithSymmetricKey ?
    PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext> : never;

  unsealingInstructions: COMMAND extends typeof ApiCalls.Command.sealWithSymmetricKey ?
    PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions> : never;

  packagedSealedMessageJson: COMMAND extends (typeof ApiCalls.Command.unsealWithSymmetricKey | typeof ApiCalls.Command.unsealWithUnsealingKey) ?
    PrescribedTextFieldObservables<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson> : never;

  private static numericRequestId: number = 0;
  requestId: PrescribedTextFieldObservables<string, typeof ApiCalls.RequestMetadataParameterNames.requestId>;
  requestUrl= new PrescribedTextFieldObservables<string, "requestUrl">("requestUrl");

  requestObject = new Observable<ApiCalls.Request | undefined>();
  responseJson = new Observable<string>();
  responseUrl = new Observable<string>();

  constructor(options: CommandSimulatorOptions<COMMAND>) {
    super (options);
    this.command = options.command;
    this.seedString = PrescribedTextFieldObservables.from(ApiRequestWithSeedParameterNames.seedString, options.seedString);
    this.respondTo = PrescribedTextFieldObservables.from(UrlRequestMetadataParameterNames.respondTo, options.respondTo);

    this.derivationOptionsJson = (
      (ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson in ParameterNames[this.command]) ?
        PrescribedTextFieldObservables.from(
         ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson, options.derivationOptionsJson
        ) :
        undefined
    ) as typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson extends keyof typeof ParameterNames[COMMAND] ?
      PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson> :
      never;

    this.message = (options.command === ApiCalls.Command.generateSignature ? PrescribedTextFieldObservables.from(
        // FIXME -- needs to indicate base 64 encoding.
        ApiCalls.GenerateSignatureParameterNames.message, {...options.message}
      ) : undefined
    ) as COMMAND extends typeof ApiCalls.Command.generateSignature ? PrescribedTextFieldObservables<string, typeof ApiCalls.GenerateSignatureParameterNames.message> : never;

    this.messageBase64 = (options.command === ApiCalls.Command.generateSignature ? PrescribedTextFieldObservables.from(
        // FIXME -- needs to indicate base 64 encoding.
        ApiCalls.GenerateSignatureParameterNames.message + "Base64", {//...options.messageBase64
        }
      ) : undefined
    ) as COMMAND extends typeof ApiCalls.Command.generateSignature ? PrescribedTextFieldObservables<string, typeof ApiCalls.GenerateSignatureParameterNames.message> : never;

    if (options.command === ApiCalls.Command.generateSignature) {
      this.message.actual.observe( message => 
        this.messageBase64.prescribed.set(urlSafeBase64Encode(stringToUtf8ByteArray(message ?? "")))
      )
    }

    this.plaintext = (options.command === ApiCalls.Command.sealWithSymmetricKey ? PrescribedTextFieldObservables.from(
        ApiCalls.SealWithSymmetricKeyParameterNames.plaintext, {
          prescribed: "Shh.... don't tell anyone!",
          ...options.plaintext
        }
      ) : undefined
    ) as COMMAND extends typeof ApiCalls.Command.sealWithSymmetricKey ?
      PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext> : never

    this.plaintextBase64 = (options.command === ApiCalls.Command.sealWithSymmetricKey ? PrescribedTextFieldObservables.from(
        ApiCalls.SealWithSymmetricKeyParameterNames.plaintext + "Base64", {///          ...options.plaintextBase64
        }
      ) : undefined
    ) as COMMAND extends typeof ApiCalls.Command.sealWithSymmetricKey ?
      PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext> : never;

    if (options.command === ApiCalls.Command.sealWithSymmetricKey) {
      this.plaintext.actual.observe( plaintext => 
        this.plaintextBase64.prescribed.set(urlSafeBase64Encode(stringToUtf8ByteArray(plaintext ?? "")))
      )
    }

    this.unsealingInstructions = (options.command === ApiCalls.Command.sealWithSymmetricKey ? 
      PrescribedTextFieldObservables.from(
        ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions, options.unsealingInstructions
      ) : undefined
    ) as COMMAND extends typeof ApiCalls.Command.sealWithSymmetricKey ?
      PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions> : never;

    this.packagedSealedMessageJson =  ( (options.command === ApiCalls.Command.sealWithSymmetricKey || options.command === ApiCalls.Command.unsealWithUnsealingKey) ? 
        PrescribedTextFieldObservables.from(
          ApiCalls.UnsealParameterNames.packagedSealedMessageJson, options.packagedSealedMessageJson
        ) : undefined
    ) as COMMAND extends (typeof ApiCalls.Command.unsealWithSymmetricKey | typeof ApiCalls.Command.unsealWithUnsealingKey) ?
      PrescribedTextFieldObservables<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson> : never;


    this.requestId = PrescribedTextFieldObservables.from(
      ApiCalls.RequestMetadataParameterNames.requestId, options.requestId ?? {prescribed: `req-${++CommandSimulator.numericRequestId}`}
    );
    this.requestUrl = new PrescribedTextFieldObservables("requestUrl", options.requestUrl);
    this.requestUrl.prescribed.set( this.prescribedRequestUrl );
    for (const requestUrlShouldObserve of  [this.derivationOptionsJson, this.messageBase64, this.plaintextBase64, this.unsealingInstructions, this.packagedSealedMessageJson, this.requestUrl] as const) {
      requestUrlShouldObserve?.actual.onChange( () => this.requestUrl.prescribed.set(
         this.prescribedRequestUrl) );
    }
    this.requestUrl.actual.observe( () =>  this.processRequestUrl() );
    this.seedString.actual.onChange( () => this.processRequestUrl() );
  }

  get prescribedRequestUrl(): string {
    const url = new URL(`https://dicekeys.app/`);
    url.searchParams.append(ApiCalls.RequestCommandParameterNames.command, this.command);
    const parameters = [
      "requestId",
      "respondTo",
      ...(Object.keys(ApiCalls.ParameterNames[this.command]) as (KeysIncludingOptionalKeys<ApiCalls.Parameters>)[])
    ] as const;
    for (const parameterName of parameters) {
      if (parameterName === "message") {
        url.searchParams.append(parameterName, this.messageBase64.actual.value ?? "");
      } else if (parameterName === "plaintext") {
        url.searchParams.append(parameterName, this.plaintextBase64.actual.value ?? "");
      } else {
        const parameter = this[parameterName];
        const parameterValue = parameter?.actual.value;
        if (parameter != null && parameterValue != null) {
          url.searchParams.append(parameterName, parameterValue);
        }
      }
    }
    try {
      this.requestObject.set(getApiRequestFromSearchParams(url.searchParams));
    } catch {
      this.requestObject.set(undefined);
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
        const responseObject = await new ComputeApiCommandWorker().calculate({seedString, request});
        responseObject.requestId = searchParams.get("requestId")!;
        const responseJson = jsonStringifyWithSortedFieldOrder(responseObject, " ");
        this.responseJson.set(responseJson);
        const responseUrl = addResponseToUrl(command, respondTo, responseObject);
        this.responseUrl.set(responseUrl);
      } catch (e) {
        this.responseUrl.set(e?.toString() ?? "Unknown exception")
      }
    }
  }

  get requiresDerivationOptionsJson(): boolean {
    return !!this.command &&
      ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson in ApiCalls.ParameterNames[this.command];
  }

  get requiresMessage(): boolean { return this.command === ApiCalls.Command.sealWithSymmetricKey };
  get requiresPackagedSealedMessage(): boolean {
    return this.command === ApiCalls.Command.unsealWithUnsealingKey ||
           this.command === ApiCalls.Command.unsealWithSymmetricKey;
  }
  get requiresClientMayRetrieveKey(): boolean {
    return !!this.command && ApiCalls.commandRequiresDerivationOptionOfClientMayRetrieveKey(this.command);
  }

  commandHasParameter = (parameterName: string): boolean =>
    !!this.command && parameterName in ApiCalls.ParameterNames[this.command];

  prescribedTextInput = (
    parameter: PrescribedTextFieldObservables<string, string>
  ): Appendable => 
    new LabeledPrescribedTextInput({observables: parameter}, `${parameter.name}`);
  

  prescribedTextInputIfParameterOfCommand = (
    parameter?: PrescribedTextFieldObservables<string, string>
  ): Appendable[] => {
    return (parameter && this.commandHasParameter(parameter.name)) ?
      [this.prescribedTextInput(parameter)] :
      []
  }

  render() {
    // this.append(
    //   Select({value: this.command},
    //     Option({}, ""),
    //     ...ApiCalls.Commands.map( command => Option({value: command, ...(command === this.command ? {selected: ""} : {})}, command) )
    //   ).with( select => select.events.change.on( () => {
    //     this.command.set(select.primaryElement.value as COMMAND);
    //     this.renderSoon();
    //   }))
    // );
    super.render(
      Div({},
        Div({}, `Command: ${this.command}`),
      ),
      // FIXME -- conditionally render if not set
      // ...this.prescribedTextInputIfParameterOfCommand(this.seedString),
      // ...this.prescribedTextInputIfParameterOfCommand(this.requestUrl),
      this.prescribedTextInput(this.requestId),

      // ...this.prescribedTextInputIfParameterOfCommand(this.derivationOptionsJson),
      ...this.prescribedTextInputIfParameterOfCommand(this.message),
      ...(this.command === ApiCalls.Command.generateSignature ? [
        this.prescribedTextInput(this.messageBase64)
      ] : []),
      ...this.prescribedTextInputIfParameterOfCommand(this.plaintext),
      ...(this.command === ApiCalls.Command.sealWithSymmetricKey ? [
          this.prescribedTextInput(this.plaintextBase64)
        ] : []),
      ...this.prescribedTextInputIfParameterOfCommand(this.unsealingInstructions),
      ...this.prescribedTextInputIfParameterOfCommand(this.packagedSealedMessageJson),
      // Div({},
      //   Div({style: "overflow-wrap: break-word;"}, "Request (JSON):"),
      //   Pre({}).withElement( e => this.requestObject.observe( requestObj =>
      //     e.textContent = requestObj == null ? "" : jsonStringifyWithSortedFieldOrder(requestObj, " ")
      //   ))  
      // ),
      new LabeledPrescribedTextInput({observables: this.requestUrl}, "Request URL:"),
      Div({},
        Div({}, "Response URL:"),
        Div({style: "overflow-wrap: break-word;"}).withElement( e => this.responseUrl.observe( (newResponseUrl) => e.textContent = newResponseUrl ?? "" ))  
      ),
      Div({},
        Div({style: "overflow-wrap: break-word;"}, "Response (JSON):"),
        Pre({}).withElement( e => this.responseJson.observe( (responseJson) => e.textContent = responseJson ?? "" ))  
      ),
    )
  }
}


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

// export class SymmetricSealAndUnsealDemo extends Component<MultiCommandSimulatorOptions>