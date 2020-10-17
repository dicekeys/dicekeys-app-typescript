import style from "./demo.module.css";
import {
  ApiCalls,
  DerivationOptions,
  stringToUtf8ByteArray,
  UrlRequestMetadataParameterNames,
  urlSafeBase64Decode,
  urlSafeBase64Encode,
  utf8ByteArrayToString,
  PasswordJson,
  SecretJson
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Observable, Div, Appendable, Span
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
  throwIfUrlNotPermitted,
} from "../../api-handler/url-permission-checks";
import {
  PrescribedTextFieldObservablesOrSpecification,
  PrescribedTextFieldObservables,
  PrescribedTextInput
} from "../basic-building-blocks";
import { jsonStringifyWithSortedFieldOrder } from "~api-handler/json";
import {
  FnCallName,
  Formula,
  TemplateInputVar,
  Instructions,
  ParameterCard,
  ResultTextBlock, FnCall, InputVar, TemplateString, UrlParameter, ResultLabel
} from "./basic-api-demo-components"
import { restrictionsJson } from "~dicekeys/restrictions-json";
import { commandRequiresDerivationOptionOfClientMayRetrieveKey, requestHasDerivationOptionsParameter, SeededCryptoObjectResponseParameterNames } from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {
  mutateRequest
} from "~api-handler/mutate-request";
import { DICEKEY, DICEKEYS } from "~web-components/dicekey-styled";
import { throwIfClientMayNotRetrieveKey } from "~api-handler/permission-checks";


const commandsWithPlaintextResponse = new Set<ApiCalls.Command>([
  ApiCalls.Command.unsealWithSymmetricKey,
  ApiCalls.Command.unsealWithUnsealingKey
]);

type SeededCryptoResponseType<COMMAND extends ApiCalls.Command> = {
  [key in (COMMAND extends ApiCalls.CommandWithJsonResponse ? ApiCalls.SeededCryptoObjectResponseParameterName<COMMAND>: never)]?: Observable<string | undefined>;
}

export type CommandSimulatorOptions<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> = {
  command: COMMAND;

  getGlobalSealingKey?: COMMAND extends typeof ApiCalls.Command.getSealingKey ? boolean : never;

  inputs?: {
    seedString?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiRequestWithSeedParameterNames.seedString>;
    respondTo?: PrescribedTextFieldObservablesOrSpecification<string, typeof UrlRequestMetadataParameterNames.respondTo>;
    requestId?: PrescribedTextFieldObservables<string, typeof ApiCalls.RequestMetadataParameterNames.requestId>;

    authorizedDomains?: Observable<string[]>,

    messageString?: PrescribedTextFieldObservablesOrSpecification<string, "messageString">;
    messageBase64?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.GenerateSignatureParameterNames.message>
    plaintextString?: PrescribedTextFieldObservablesOrSpecification<string, "plaintextString">;
    plaintextBase64?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.plaintext>;

    derivationOptionsJsonMayBeModified?:  Observable<boolean | undefined>;

    
    unsealingInstructions?: COMMAND extends (typeof ApiCalls.Command.sealWithSymmetricKey) ?
      PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions> :
      never;
    packagedSealedMessageJson?: PrescribedTextFieldObservablesOrSpecification<string, typeof ApiCalls.UnsealParameterNames.packagedSealedMessageJson>;
  }
  outputs?: SeededCryptoResponseType<COMMAND> & {
    responseObject?: Observable<ApiCalls.ResponseForCommand<COMMAND> | ApiCalls.ExceptionResponse | undefined>;
    signature?: Observable<string | undefined>;
    plaintextBase64Output?: Observable<string | undefined>;
    plaintextStringOutput?: Observable<string | undefined>;
    packagedSealedMessageJsonOutput?: Observable<string | undefined>;
    exception?: Observable<string | undefined>;
    exceptionMessage?: Observable<string | undefined>;
  }
} & Attributes<"div">


type KeysIncludingOptionalKeys<T> = T extends any ? keyof T : never;

// export SealAndUnsealCommandSimulator


export class CommandSimulator<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> extends Component<CommandSimulatorOptions<COMMAND>> {

  readonly command: COMMAND;
  readonly seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;
  readonly respondTo: PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>;

  readonly derivationOptionsJson: PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>;
  readonly derivationOptionsJsonMayBeModified:  Observable<boolean | undefined>;

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
  responseUrlObject = new Observable<URL | undefined>();

  responseObject: Observable<ApiCalls.ResponseForCommand<COMMAND> | ApiCalls.ExceptionResponse | undefined>;

  seededCryptoObjectAsJson?: Observable<string | undefined>;
  signature: Observable<string | undefined>;
  plaintextBase64Output: Observable<string | undefined>;
  plaintextStringOutput: Observable<string | undefined>;
  authorizedDomains: Observable<string[]>;

  exception: Observable<string | undefined>;
  exceptionMessage: Observable<string | undefined>;

  constructor(options: CommandSimulatorOptions<COMMAND>) {
    super (options);
    this.addClass(style.operation_card);
    const command = options.command;
    this.command = command;
    this.plaintextBase64Output = options.outputs?.plaintextBase64Output ?? new Observable<string | undefined>();
    this.plaintextStringOutput = options.outputs?.plaintextStringOutput ?? new Observable<string | undefined>();
    this.authorizedDomains = options.inputs?.authorizedDomains ?? new Observable();
    this.exception = options.outputs?.exception ?? new Observable<string | undefined>();
    this.exceptionMessage = options.outputs?.exceptionMessage ?? new Observable();
    this.derivationOptionsJsonMayBeModified = options.inputs?.derivationOptionsJsonMayBeModified ?? new Observable<boolean | undefined>(
      this.command === "sealWithSymmetricKey" || this.command === "getSealingKey"
    )
    this.seedString = PrescribedTextFieldObservables.from(ApiRequestWithSeedParameterNames.seedString, options.inputs?.seedString);
    this.respondTo = PrescribedTextFieldObservables.from(UrlRequestMetadataParameterNames.respondTo, options.inputs?.respondTo);

    this.responseObject = options.outputs?.responseObject ?? new Observable<ApiCalls.ResponseForCommand<COMMAND> | ApiCalls.ExceptionResponse | undefined>();


    this.derivationOptionsJson = new PrescribedTextFieldObservables<string, typeof ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson>(
      ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson, {
        formula: Formula("derivationOptionsJson", "string", `'{${
          commandRequiresDerivationOptionOfClientMayRetrieveKey(this.command) ? `"clientMayRetrieveKey":true,` : ""
        }"allow":[{"host":"*.`, TemplateInputVar("authorizedDomains[i]"), `"}]}'`),
    });
    // Update derivation options based on domains.
    this.authorizedDomains.observe( domains => domains &&
      this.derivationOptionsJson.prescribed.set(restrictionsJson(domains ?? [], commandRequiresDerivationOptionOfClientMayRetrieveKey(this.command))
    ));

    // if (this.derivationOptionsJson && this.options.inputs?.authorizedDomains) {
    //   this.options.inputs.authorizedDomains.observe( (authorizedDomains) =>
    //     this.derivationOptionsJson.prescribed.set(restrictionsJson(authorizedDomains ?? [], commandRequiresDerivationOptionOfClientMayRetrieveKey(this.command)))
    //   )
    // }

    this.messageString = PrescribedTextFieldObservables.from("messageString", options.inputs?.messageString);
    this.messageBase64 = PrescribedTextFieldObservables.from(
      ApiCalls.GenerateSignatureParameterNames.message, options.inputs?.messageBase64 ?? {
        formula: Formula("message", "string | byte[]",  FnCall("base64urlEncode", InputVar("messageString")))
      });

    if (command === ApiCalls.Command.generateSignature) {
      this.messageString.actual.observe( message => 
        this.messageBase64.prescribed.set(urlSafeBase64Encode(stringToUtf8ByteArray(message ?? "")))
      )
    }

    this.plaintextString = PrescribedTextFieldObservables.from(
      "plaintextString", options.inputs?.plaintextString ?? (
        (command === ApiCalls.Command.sealWithSymmetricKey) ? {
          formula: Formula("plaintext", "string | byte[]", Span({style: 'font-style: italic'},"the content you wish to encrypt")),
          actual: "Easy as API!",
        } : {}
      )
    );

    this.plaintextBase64 = PrescribedTextFieldObservables.from(
      ApiCalls.SealWithSymmetricKeyParameterNames.plaintext, {
        formula: Formula("plaintext", "string", FnCall("base64urlEncode", InputVar("plaintextUtf8")))
      }
    );

    if (command === ApiCalls.Command.sealWithSymmetricKey) {
      // FIXME -- separating input plaintext from output plaintext
      this.plaintextString.actual.observe( plaintext => 
        this.plaintextBase64.prescribed.set(urlSafeBase64Encode(stringToUtf8ByteArray(plaintext ?? "")))
      )
    } else if (command === ApiCalls.Command.unsealWithUnsealingKey || command === ApiCalls.Command.unsealWithSymmetricKey) {
      this.plaintextBase64Output.observe( plaintextBase64Output => {
        try {
          this.plaintextStringOutput.set(utf8ByteArrayToString(urlSafeBase64Decode(plaintextBase64Output ?? "")));
        } catch {
          this.plaintextStringOutput.set("(Not a UTF8 string)")
        }
      })
    }

    this.unsealingInstructions = PrescribedTextFieldObservables.from(
      ApiCalls.SealWithSymmetricKeyParameterNames.unsealingInstructions, options.inputs?.unsealingInstructions ?? {
        formula: Formula("unsealingInstructions", "string", `'{"allow":[{"host":"*.`, TemplateInputVar("authorizedDomains[i]"), `"}]}'`)
      }
    );
    
    this.packagedSealedMessageJson = PrescribedTextFieldObservables.from(
      ApiCalls.UnsealParameterNames.packagedSealedMessageJson, options.inputs?.packagedSealedMessageJson
    );


    this.requestId = PrescribedTextFieldObservables.from(
      ApiCalls.RequestMetadataParameterNames.requestId, options.inputs?.requestId ?? {
        formula: Formula("requestId", "string", Span({class: style.command_name},"getUniqueId"), "()"),
        prescribed: `${++CommandSimulator.numericRequestId
      }`}
    );

    const requestUrlFormula: Appendable = Formula('requestUrl', "string",
      `\`https://dicekeys.app?`,
      UrlParameter("command", command),
      ...(this.parameterNames.map( (parameterName): Appendable =>
        ((parameterName === "derivationOptionsJson" || parameterName === "derivationOptionsJsonMayBeModified") && this.options.getGlobalSealingKey) ? [] : [
          "&",
          UrlParameter(parameterName, 
          (parameterName === "message" || parameterName === "plaintext") ?
            TemplateString( FnCall("base64urlEncode", InputVar(parameterName))) :
            TemplateInputVar(parameterName)
        )])),
      "\`"
    );

    this.requestUrl = new PrescribedTextFieldObservables<string, "requestUrl">("requestUrl", {formula: requestUrlFormula});
    this.requestUrl.prescribed.set( this.prescribedRequestUrl );
    for (const requestUrlShouldObserve of  [this.derivationOptionsJson, this.messageBase64, this.plaintextBase64, this.unsealingInstructions, this.packagedSealedMessageJson, this.requestUrl] as const) {
      requestUrlShouldObserve?.actual.onChange( () => this.requestUrl.prescribed.set(
         this.prescribedRequestUrl) );
    }
    this.requestUrl.actual.observe( () =>  this.processRequestUrl() );
    this.seedString.actual.onChange( () => this.processRequestUrl() );

    if (ApiCalls.commandHasJsonResponse(command)) {
      const outputs = options.outputs as SeededCryptoResponseType<ApiCalls.CommandWithJsonResponse>;
      this.seededCryptoObjectAsJson = outputs?.[ApiCalls.SeededCryptoObjectResponseParameterNames[command]] ?? new Observable<string | undefined>();
    }    
    this.signature = options.outputs?.signature ?? new Observable<string | undefined>();

    this.responseUrlObject.observe( responseUrlObj => {
      const searchParams = responseUrlObj?.searchParams;
      if (!searchParams) return;
      if (ApiCalls.commandHasJsonResponse(command)) {
        const seededCryptoObjectAsJson = searchParams.get(SeededCryptoObjectResponseParameterNames[command]);
        this.seededCryptoObjectAsJson?.set(seededCryptoObjectAsJson ?? undefined);
      }
      const plaintext = searchParams.get("plaintext");
      if (plaintext) this.plaintextBase64Output.set(plaintext);
      const signature = searchParams.get("signature");
      if (signature) this.signature.set(signature);
      const exception = searchParams.get(ApiCalls.ExceptionResponseParameterNames.exception);
      this.exception.set(exception ?? "")
      const exceptionMessage = searchParams.get(ApiCalls.ExceptionResponseParameterNames.message);
      this.exceptionMessage.set( (exceptionMessage && exceptionMessage != exception) ? exceptionMessage : "" );
    })
  }

  get parameterNames(): ("requestId" | "respondTo"| KeysIncludingOptionalKeys<ApiCalls.Parameters>)[] {
    var allParameterNames = [
      "requestId",
      "respondTo",
      ...(Object.keys(ApiCalls.ParameterNames[this.command]) as (KeysIncludingOptionalKeys<ApiCalls.Parameters>)[])
    ] as ("requestId" | "respondTo"| KeysIncludingOptionalKeys<ApiCalls.Parameters>)[];
    if ("unsealingInstructions" in ApiCalls.ParameterNames[this.command] && !this.unsealingInstructions.actual.value) {
      // We only include the unsealingInstructions parameter if there are instructions
      allParameterNames = allParameterNames.filter( pname => pname != "unsealingInstructions");
    }
    if ("derivationOptionsJson" in ApiCalls.ParameterNames[this.command] && !this.derivationOptionsJson.actual.value) {
      // We only include the unsealingInstructions parameter if there are instructions
      allParameterNames = allParameterNames.filter( pname => pname != "derivationOptionsJson");
    }
    return allParameterNames;
  }

  get prescribedRequestUrl(): string {
    const url = new URL(`https://dicekeys.app/`);
    url.searchParams.append(ApiCalls.RequestCommandParameterNames.command, this.command);
    for (const parameterName of this.parameterNames) {
      if (parameterName === "message") {
        url.searchParams.append(parameterName, this.messageBase64.actual.value ?? "");
      } else if (parameterName === "plaintext") {
        url.searchParams.append(parameterName, this.plaintextBase64.actual.value ?? "");
      } else if (parameterName === "derivationOptionsJsonMayBeModified") {
        const derivationOptionsJsonMayBeModified = this[parameterName].value;
        if (derivationOptionsJsonMayBeModified != null) {
          url.searchParams.append(parameterName, derivationOptionsJsonMayBeModified ? "true" : "false");
        }
      } else if (parameterName === "derivationOptionsJson" && !this[parameterName].value ) {
        // Don't send the derivationOptionsJson parameter if it's undefined or an empty string
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
      const respondTo = searchParams.get(UrlRequestMetadataParameterNames.respondTo);
      const seedString = this.seedString.value;
      var request = getApiRequestFromSearchParams(requestUrl.searchParams);
      if (seedString && request && respondTo) {
        const respondToUrl = new URL(respondTo);
        throwIfUrlNotPermitted(respondToUrl.host, respondToUrl.pathname, false);
        throwIfClientMayNotRetrieveKey(request);
        if (requestHasDerivationOptionsParameter(request)) {
          const derivationOptions = DerivationOptions(request.derivationOptionsJson);
          request = await mutateRequest({
            seedString,
            request,
            // Add a unique id for sealing keys that have no restrictions that would limit anyone
            // from unsealing them, as having a single key would make users linkable
            addUniqueId: request.command === ApiCalls.Command.getSealingKey && !derivationOptions.allow
          });
        }
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
      this.responseUrl.set("Exception: " + (
        ("name" in e && "message" in e && e.message) ? 
          `${e.name} -- ${e.message}` :
          (e?.toString() ?? "unknown cause")
      ));
      this.responseUrlObject.set(undefined);
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
    const command = this.command;
    super.render(
      Div({class: style.operation_card_title}, `${this.command}`),
      ////////////
      // REQUEST
      ////////////
      Div({class: style.section},
        Div({class: style["section-header"]}, "Request"),
        //
        // requestId
        //
        ParameterCard(
          Instructions("Each request should have a requestId that is unique (random or sequential) so that you can match the response to it."),
          new PrescribedTextInput({style: `width: 16rem;`, observables: this.requestId})
        ),
        //
        // Derivation options
        //
        ...((this.command === ApiCalls.Command.unsealWithSymmetricKey || this.command === ApiCalls.Command.unsealWithUnsealingKey) ?
          [
            ParameterCard(
              Instructions("The sealed message to be unsealed."),
              new PrescribedTextInput({observables: this.packagedSealedMessageJson})
            )
          ] :
          (this.command === ApiCalls.Command.getSealingKey && this.options.getGlobalSealingKey) ? [
            ParameterCard(
              Instructions( 
                `Calls to `, FnCallName("getSealingKey"),` normally take a `, InputVar(ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson),`
                parameter with an <i>allow</i> field restricting which applications/services may use the derived key. Such requests require
                the user to get access to their `, DICEKEY(), ` to derive the new key.
              `),
              Instructions(`
                To instead get a global sealing key, which the user may have pre-derived and have available without accessing their `, DICEKEY(), `
                do not pass the `,
                InputVar(ApiCalls.DerivationFunctionParameterNames.derivationOptionsJson),
                ` parameter.  The `, DICEKEYS() ,` App may use an existing key with a pre-chosen derivationOptionsJson.
                In this example, we assume it derived multiple keys with different uniqueId fields to ensure keys are not linkable.`
              ),
            ),

          ] :
          [
            ParameterCard(
              Instructions( 
                `You can specify the options for deriving secrets via a <a targe="new" href="https://dicekeys.github.io/seeded-crypto/derivation_options_format.html"/>JSON format</a>,
                which allow you to restrict which apps and services can use the secrets you derive.
              `),
              new PrescribedTextInput({observables: this.derivationOptionsJson}),
            ),
          ]
        ),
        //
        // Command-specific input-parameters
        //
        // generateSignature
        ...(this.command === ApiCalls.Command.generateSignature ? [
            ParameterCard(
              new PrescribedTextInput({observables: this.messageString}),
            ),
          ] : []
        ),
        // sealWithSymmetricKey
        ...(this.command === ApiCalls.Command.sealWithSymmetricKey ? [
          ParameterCard(
            new PrescribedTextInput({observables: this.plaintextString}),
          ),
          ParameterCard(
            new PrescribedTextInput({observables: this.unsealingInstructions}),
          ).withElement( e => {
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
        //
        // Request URL
        //
        ParameterCard(
          this.requestUrl.formula.value,
          ResultTextBlock({}).updateFromObservable(this.requestUrl.actual),
        ),
      ),
      ///////////
      // RESULT
      //////////
      Div({class: style.section},
        Div({class: style["section-header"]}, "Result"),
        ParameterCard(
          ResultLabel("Sent via URL"),
          ResultTextBlock({}).updateFromObservable(this.responseUrl)
        ),

        ...((this.command === ApiCalls.Command.generateSignature) ? [
          ParameterCard(
            ResultLabel("signature"),
            Div({class: style.result_value}).withElement( e =>
              this.responseUrlObject.observe( responseUrlObject => 
                e.textContent = responseUrlObject?.searchParams.get("signature") ?? ""
              )
            )
          ),
        ] : []),
        ...((ApiCalls.commandHasJsonResponse(command)) ? [
          ParameterCard(
            ResultLabel(ApiCalls.SeededCryptoObjectResponseParameterNames[command]),
            ResultTextBlock({}).withElement( e =>
              this.seededCryptoObjectAsJson?.observe( json => {
                if (json) {
                  e.textContent = json;
                } else {    
                  e.innerHTML = "<i>undefined</i>";
                }
              })
            )
          )
        ] : []),
        ...((commandsWithPlaintextResponse.has(this.command)) ? [
          ParameterCard(
            ResultLabel(FnCall("base64urlDecode", "plaintext")),
            ResultTextBlock({}).updateFromObservable( this.plaintextStringOutput )
          ),
        ] : []),
        ...((this.command === "getPassword") ? [
            ParameterCard(
              ResultLabel("password"),
              ResultTextBlock({}).withElement( e => this.seededCryptoObjectAsJson?.observe( json => {
                try { e.textContent = json ? (JSON.parse(json) as PasswordJson).password : "" }
                catch { e.textContent = "" }
              }))
            ),
          ] : []
        ),
        ...((this.command === "getSecret") ? [
            ParameterCard(
              ResultLabel(FnCall("base64urlDecode", "secret")),
              ResultTextBlock({}).withElement( e => this.seededCryptoObjectAsJson?.observe( json => {
                try { e.textContent = 
                  json ? (
                    [...(urlSafeBase64Decode((JSON.parse(json) as SecretJson).secretBytes))]
                    .map( hexByte => hexByte.toString(16) ).join("")
                  ) : ""
                }
                catch { e.textContent = "" }
              }))
            ) 
          ] : []
        ),
      ParameterCard(
        ResultLabel("exception"),
        ResultTextBlock({}).updateFromObservable( this.exception )
      ).withElement( e => { this.exception.observe( exception => e.style.display = exception ? "block" : "none" ) }),
      ParameterCard(
        ResultLabel("exceptionMessage"),
        ResultTextBlock({}).updateFromObservable( this.exceptionMessage )
      ).withElement( e => { this.exceptionMessage.observe( exceptionMessage => e.style.display = exceptionMessage ? "block" : "none" ) })
    ))
  }
}
