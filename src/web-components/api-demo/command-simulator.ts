import style from "./demo.module.css";
import {
  ApiCalls, DerivationOptions, stringToUtf8ByteArray, UrlRequestMetadataParameterNames, urlSafeBase64Decode, urlSafeBase64Encode, utf8ByteArrayToString
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Observable, Div, Appendable, Span, TextAreaAutoGrow
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
  PrescribedTextInput
} from "../basic-building-blocks";
import { jsonStringifyWithSortedFieldOrder } from "~api-handler/json";
import {
  Formula,
  FormulaInputVariable
} from "./formula"
import { derivationOptionsJsonForAllowedDomains } from "~dicekeys/derivation-options-json-for-allowed-domains";

const commandsWithSeededCryptoObjectResponse = new Set<ApiCalls.Command>([
  ApiCalls.Command.getPassword,
  ApiCalls.Command.getSealingKey,
  ApiCalls.Command.getSecret,
  ApiCalls.Command.getSignatureVerificationKey,
  ApiCalls.Command.getSigningKey,
  ApiCalls.Command.getSymmetricKey,
  ApiCalls.Command.getUnsealingKey,
  ApiCalls.Command.sealWithSymmetricKey
]);
const commandsWithPlaintextResponse = new Set<ApiCalls.Command>([
  ApiCalls.Command.unsealWithSymmetricKey,
  ApiCalls.Command.unsealWithUnsealingKey
]);

interface CommandSimulatorOptions<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> extends Attributes<"div"> {
  command: COMMAND;
  seedString?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  respondTo?: PrescribedTextFieldObservablesOrSpecification<string, typeof UrlRequestMetadataParameterNames.respondTo>;
  requestId?: PrescribedTextFieldObservables<string, typeof ApiCalls.RequestMetadataParameterNames.requestId>;

  authorizedDomains?: Observable<string[]>,

  messageString?: PrescribedTextFieldObservablesOrSpecification<string, "messageString">;
  messageBase64?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.GenerateSignatureParameterNames.message>
  plaintextString?: PrescribedTextFieldObservablesOrSpecification<string, "plaintextString">;
  plaintextBase64?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext>;
  
  unsealingInstructions?: COMMAND extends (typeof ApiCalls.Command.sealWithSymmetricKey) ?
    PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions> :
    never;
  packagedSealedMessageJson?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson>;

  responseObject?: Observable<ApiCalls.ResponseForCommand<COMMAND> | ApiCalls.ExceptionResponse>;
  seededCryptoObjectAsJson?: Observable<string>
  signature?: Observable<string>
}


type KeysIncludingOptionalKeys<T> = T extends any ? keyof T : never;

// export SealAndUnsealCommandSimulator


export class CommandSimulator<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> extends Component<CommandSimulatorOptions<COMMAND>> {

  readonly command: COMMAND;
  readonly seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  readonly respondTo: PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>;

  readonly derivationOptionsJson: PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;
  
  messageString: PrescribedTextFieldObservables<string, "messageString">;
  messageBase64: PrescribedTextFieldObservables<string, typeof ApiCalls.GenerateSignatureParameterNames.message> ;

  plaintextString: PrescribedTextFieldObservables<string, "plaintextString">;
  plaintextBase64: PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext>;

  unsealingInstructions: PrescribedTextFieldObservables<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions>;

  packagedSealedMessageJson: PrescribedTextFieldObservables<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson>;

  private static numericRequestId: number = 0;
  requestId: PrescribedTextFieldObservables<string, typeof ApiCalls.RequestMetadataParameterNames.requestId>;
  requestUrl= new PrescribedTextFieldObservables<string, "requestUrl">("requestUrl");

  requestObject = new Observable<ApiCalls.CommandsApiCall<COMMAND>["request"] | undefined>();
  responseJson = new Observable<string>();
  responseUrl = new Observable<string>();
  responseUrlObject = new Observable<URL>();

  responseObject: Observable<ApiCalls.ResponseForCommand<COMMAND> | ApiCalls.ExceptionResponse>;

  seededCryptoObjectAsJson: Observable<string>;
  signature: Observable<string>;
  authorizedDomains: Observable<string[]>;

  constructor(options: CommandSimulatorOptions<COMMAND>) {
    super (options);
    this.command = options.command;
    this.authorizedDomains = options.authorizedDomains ?? new Observable();
    this.seedString = PrescribedTextFieldObservables.from(ApiRequestWithSeedParameterNames.seedString, options.seedString);
    this.respondTo = PrescribedTextFieldObservables.from(UrlRequestMetadataParameterNames.respondTo, options.respondTo);

    this.responseObject = options.responseObject ?? new Observable<ApiCalls.ResponseForCommand<COMMAND> | ApiCalls.ExceptionResponse>()

    this.derivationOptionsJson = new PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>(
      ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson, {
      formula: Formula("derivationOptionsJson", `'{"allow":[{"host":"*.`, FormulaInputVariable({}, "authorizedDomains[i]"), `"}]}'`),
    });
    // Update derivation options based on domains.
    this.authorizedDomains.observe( domains => domains &&
      this.derivationOptionsJson.prescribed.set(derivationOptionsJsonForAllowedDomains(domains)
    ));

    if (this.derivationOptionsJson && this.options.authorizedDomains) {
      this.options.authorizedDomains.observe( (authorizedDomains) =>
        this.derivationOptionsJson.prescribed.set(derivationOptionsJsonForAllowedDomains(authorizedDomains ?? []))
      )
    }

    this.messageString = PrescribedTextFieldObservables.from("messageString", options.messageString);
    this.messageBase64 = PrescribedTextFieldObservables.from(ApiCalls.GenerateSignatureParameterNames.message, options.messageBase64);

    if (this.command === ApiCalls.Command.generateSignature) {
      this.messageString.actual.observe( message => 
        this.messageBase64.prescribed.set(urlSafeBase64Encode(stringToUtf8ByteArray(message ?? "")))
      )
    }

    this.plaintextString = PrescribedTextFieldObservables.from(
      "plaintextString", options.plaintextString ?? (
        (this.command === ApiCalls.Command.sealWithSymmetricKey) ? {
        actual: "Easy as API!",
        } : {}
      )
    );

    this.plaintextBase64 = PrescribedTextFieldObservables.from(
      ApiCalls.SealWithSymmetricKeyParameterNames.plaintext, {
        formula: Formula("plaintextBase64", "urlSafeBase64Encode(toUtf8(", FormulaInputVariable({},"plaintext"), "))")
      }
    );

    if (this.command === ApiCalls.Command.sealWithSymmetricKey) {
      this.plaintextString.actual.observe( plaintext => 
        this.plaintextBase64.prescribed.set(urlSafeBase64Encode(stringToUtf8ByteArray(plaintext ?? "")))
      )
    } else if (this.command === ApiCalls.Command.unsealWithUnsealingKey || this.command === ApiCalls.Command.unsealWithSymmetricKey) {
      this.plaintextBase64.actual.observe( plaintextBase64 => {
        try {
          this.plaintextString.set(utf8ByteArrayToString(urlSafeBase64Decode(plaintextBase64 ?? "")));
        } catch {
          this.plaintextString.set("(Not a UTF8 string)")
        }
      })
    }

    this.unsealingInstructions = PrescribedTextFieldObservables.from(
      ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions, options.unsealingInstructions ?? {
        formula: Formula("unsealingInstructions", `'{"allow":[{"host":"*.`, FormulaInputVariable({}, "authorizedDomains[i]"), `"}]}'`)
      }
    );
    
    this.packagedSealedMessageJson = PrescribedTextFieldObservables.from(
      ApiCalls.UnsealParameterNames.packagedSealedMessageJson, options.packagedSealedMessageJson
    );


    this.requestId = PrescribedTextFieldObservables.from(
      ApiCalls.RequestMetadataParameterNames.requestId, options.requestId ?? {
        formula: Formula("requestId", "getUniqueId()"),
        prescribed: `${++CommandSimulator.numericRequestId
      }`}
    );

    const requestUrlFormula: Appendable = Formula('requestUrl', `'https://dicekeys.app?command=`, Span({class: style.command_in_request_url_formula}, this.command),
      ...(this.parameterNames.map( (parameterName): Appendable =>
        (["&", parameterName, "=", FormulaInputVariable({}, `${parameterName}${parameterName === "message" || parameterName === "plaintext" ? "Base64" : ""}`)])
      )),
      "'"
    );

    this.requestUrl = new PrescribedTextFieldObservables<string, "requestUrl">("requestUrl", {formula: requestUrlFormula});
    this.requestUrl.prescribed.set( this.prescribedRequestUrl );
    for (const requestUrlShouldObserve of  [this.derivationOptionsJson, this.messageBase64, this.plaintextBase64, this.unsealingInstructions, this.packagedSealedMessageJson, this.requestUrl] as const) {
      requestUrlShouldObserve?.actual.onChange( () => this.requestUrl.prescribed.set(
         this.prescribedRequestUrl) );
    }
    this.requestUrl.actual.observe( () =>  this.processRequestUrl() );
    this.seedString.actual.onChange( () => this.processRequestUrl() );

    this.seededCryptoObjectAsJson = options.seededCryptoObjectAsJson ?? new Observable<string>();
    this.signature = options.signature ?? new Observable<string>();

    this.responseUrlObject.observe( responseUrlObj => {
      const searchParams = responseUrlObj?.searchParams;
      if (!searchParams) return;
      const seededCryptoObjectAsJson = searchParams.get("seededCryptoObjectAsJson");
      if (seededCryptoObjectAsJson) this.seededCryptoObjectAsJson.set(seededCryptoObjectAsJson);
      const plaintext = searchParams.get("plaintext");
      if (plaintext) this.plaintextBase64.set(plaintext);
      const signature = searchParams.get("signature");
      if (signature) this.signature.set(signature);
    })
  }

  get parameterNames(): ("requestId" | "respondTo"| KeysIncludingOptionalKeys<ApiCalls.Parameters>)[] {
    const allParameterNames = [
      "requestId",
      "respondTo",
      ...(Object.keys(ApiCalls.ParameterNames[this.command]) as (KeysIncludingOptionalKeys<ApiCalls.Parameters>)[])
    ] as ("requestId" | "respondTo"| KeysIncludingOptionalKeys<ApiCalls.Parameters>)[];
    if ("unsealingInstructions" in ApiCalls.ParameterNames[this.command] && !this.unsealingInstructions.actual.value) {
      // We only include the unsealingInstructions parameter if there are instructions
      return allParameterNames.filter( pname => pname != "unsealingInstructions");
    } else {
      return allParameterNames;
    }
  }

  get prescribedRequestUrl(): string {
    const url = new URL(`https://dicekeys.app/`);
    url.searchParams.append(ApiCalls.RequestCommandParameterNames.command, this.command);
    for (const parameterName of this.parameterNames) {
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
    try {
      const request = getApiRequestFromSearchParams(requestUrl.searchParams);
      const respondTo = searchParams.get(UrlRequestMetadataParameterNames.respondTo);
      
      const seedString = this.seedString.value;
      if (seedString && request && respondTo) {
        const responseObject = await new ComputeApiCommandWorker().calculate({seedString, request});
        responseObject.requestId = searchParams.get("requestId")!;
        this.responseObject.set(responseObject);
        const responseJson = jsonStringifyWithSortedFieldOrder(responseObject, " ");
        this.responseJson.set(responseJson);
        const responseUrl = addResponseToUrl(command, respondTo, responseObject);
        this.responseUrl.set(responseUrl);
        this.responseUrlObject.set(new URL(responseUrl));
      }
    } catch (e) {
      this.responseUrl.set(e?.toString() ?? "Unknown exception")
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
      Div({style: `font-size: 1.5rem; font-family: monospace; background-color: #111111; color: white; width: fit-content; padding:5px; margin-top: 10px`}, `${this.command}`),
      // FIXME -- conditionally render if not set
      // ...this.prescribedTextInputIfParameterOfCommand(this.seedString),
      // ...this.prescribedTextInputIfParameterOfCommand(this.requestUrl),
      new PrescribedTextInput({style: `width: 16rem;`, observables: this.requestId}),
      ...((this.command === ApiCalls.Command.unsealWithSymmetricKey || this.command === ApiCalls.Command.unsealWithUnsealingKey) ?
        [ new PrescribedTextInput({observables: this.packagedSealedMessageJson}) ] : [
          Div({class: style
            .instructions}, 
            `You can specify the options for deriving secrets via a <a targe="new" href="https://dicekeys.github.io/seeded-crypto/derivation_options_format.html"/>JSON format</a>,
            which allow you to restrict which apps and services can use the secrets you derive.
          `),
    
          new PrescribedTextInput({style: `width: 37.5rem;`, observables: this.derivationOptionsJson}),
        ]
      ),
      // ...this.prescribedTextInputIfParameterOfCommand(this.derivationOptionsJson),
      ...(this.command === ApiCalls.Command.generateSignature ? [
        new PrescribedTextInput({observables: this.messageString}),
        new PrescribedTextInput({observables: this.messageBase64})
      ] : []),
      ...(this.command === ApiCalls.Command.sealWithSymmetricKey ? [
          new PrescribedTextInput({observables: this.plaintextString}),
          new PrescribedTextInput({observables: this.plaintextBase64}),
          new PrescribedTextInput({observables: this.unsealingInstructions}).withElement( e => {
            this.derivationOptionsJson.actual.observe( derivationOptionsJson => {
              try {
                if (DerivationOptions(derivationOptionsJson)?.allow) {
                  e.style.setProperty('display', 'none');
                  return; 
                }
              } catch {}
              e.style.setProperty('display','flex')
            })
          }),
        ] : []),

      // Div({},
      //   Div({style: "overflow-wrap: break-word;"}, "Request (JSON):"),
      //   Pre({}).withElement( e => this.requestObject.observe( requestObj =>
      //     e.textContent = requestObj == null ? "" : jsonStringifyWithSortedFieldOrder(requestObj, " ")
      //   ))  
      // ),
      Div({},this.requestUrl.formula.value),
      TextAreaAutoGrow({disabled: "", style: "width: 80vw; word-break: break-all;overflow-wrap: anywhere; overflow-y:hidden;"}).updateFromObservable(this.requestUrl.actual),
      Div({class: style.result_block},
        Div({class: style.result_label}, "Response URL:"),
        Div({class: style.result_value}).updateFromObservable(this.responseUrl) 
      ),
      // Div({},
      //   Div({style: "word-break: break-all;overflow-wrap: anywhere;"}, "Response (JSON):"),
      //   Pre({}).withElement( e => this.responseJson.observe( (responseJson) => e.textContent = responseJson ?? "" ))  
      // ),
      ...((this.command === ApiCalls.Command.generateSignature) ? [
        Div({class: style.result_block},
          Div({class: style.result_label}, "signature"),
          Div({class: style.result_value}).withElement( e =>
            this.responseUrlObject.observe( responseUrlObject => 
              e.textContent = responseUrlObject?.searchParams.get("signature") ?? ""
            )
          )
        )
      ] : []),
      ...((commandsWithSeededCryptoObjectResponse.has(this.command)) ? [
        Div({class: style.result_block},
          Div({class: style.result_label}, "seededCryptoObjectAsJson"),
          Div({class: style.result_value}).withElement( e =>
            this.responseUrlObject.observe( responseUrlObject => {
              try {
                const seededCryptoObjectAsJson = responseUrlObject?.searchParams.get("seededCryptoObjectAsJson");
                if (seededCryptoObjectAsJson) {
                  // re-parse and stringify the result to pretty-print it
                  e.textContent = jsonStringifyWithSortedFieldOrder(
                    JSON.parse(seededCryptoObjectAsJson), "  "
                  );
                }
              } catch {}
            })
          )
        )
      ] : []),
      ...((commandsWithPlaintextResponse.has(this.command)) ? [
        Div({class: style.result_block},
          Div({class: style.result_label}, "plaintext"),
          Div({class: style.result_value}).withElement( e =>
            this.plaintextBase64.actual.observe( plaintextBase64 => e.textContent = plaintextBase64 ?? "")
          ),
          Div({class: style.result_value}).withElement( e =>
            this.plaintextString.actual.observe( plaintextString => e.textContent = plaintextString ?? "")
          )
        )
      ] : []),
      
    )
  }
}
