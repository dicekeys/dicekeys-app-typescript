import {
  ApiCalls, UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  commandRequiresDerivationOptionOfClientMayRetrieveKey,
  DerivationFunctionParameterNames,
  ParameterNames
} from "@dicekeys/dicekeys-api-js/dist/api-calls";
import {
  Component, Attributes, Observable, OptionallyObservable
} from "../../web-component-framework";
import {
  PrescribedTextInput
} from "../basic-building-blocks";
import {
  ComputeApiCommandWorker
} from "../../workers/call-api-command-worker";
import {
  getApiRequestFromSearchParams,
  addResponseToUrl,
} from "../../api-handler/handle-url-api-request";

// operation
const x = {
  // DerivationOptions
  [ApiCalls.Command.getPassword]: "",
  [ApiCalls.Command.getSealingKey]: "",
  [ApiCalls.Command.getSecret]: "",
  [ApiCalls.Command.getSignatureVerificationKey]: "",
  [ApiCalls.Command.getSigningKey]: "",
  [ApiCalls.Command.getSymmetricKey]: "",
  [ApiCalls.Command.getUnsealingKey]: "",
  // DerivationOptions + message + unsealingInstructions
  [ApiCalls.Command.sealWithSymmetricKey]: "",
  // PackagedSealedMessage
  [ApiCalls.Command.unsealWithSymmetricKey]: "",
  [ApiCalls.Command.unsealWithUnsealingKey]: "",
}
console.log("", x);
// respondTo
// requestId
// exception

export interface PrescribedTextFieldSpecification<T extends string = string> {
  observable?: OptionallyObservable<T>;
  prescribed?: OptionallyObservable<T | undefined>;
  usePrescribed?: OptionallyObservable<boolean>
  forceUsePrescribed?: boolean;
}

class PrescribedTextFieldObservables<T extends string = string> {
  public readonly observable: Observable<T>;
  public readonly prescribed: Observable<T | undefined>;
  public readonly usePrescribed: OptionallyObservable<boolean>;
  public readonly forceUsePrescribed: boolean;

  public get value(): T | undefined { return this.observable.value }

  constructor(options: PrescribedTextFieldSpecification<T> = {}) {
    this.observable = Observable.from(options.observable);
    this.prescribed = Observable.from(options.prescribed);
    this.usePrescribed = Observable.from(options.usePrescribed);
    this.forceUsePrescribed = !!options.forceUsePrescribed;
  }
}

interface CommandSimulatorOptions<
  COMMAND extends ApiCalls.Command = ApiCalls.Command
> extends Attributes {
  command?: PrescribedTextFieldSpecification<COMMAND>;
  seed?: PrescribedTextFieldSpecification<string>;
  respondTo?: PrescribedTextFieldSpecification<string>;

  derivationOptionsJson?: PrescribedTextFieldSpecification<string>;
  message?: PrescribedTextFieldSpecification<string>;
  unsealingInstructions?: PrescribedTextFieldSpecification<string>;
  packagedSealedMessageJson?: PrescribedTextFieldSpecification<string>;

  requestId?: PrescribedTextFieldSpecification<string>;
  requestUrl?: PrescribedTextFieldSpecification<string>;

}

export class CommandSimulator extends Component<CommandSimulatorOptions> {
  private static readonly computeApiCommandWorker = new ComputeApiCommandWorker();

  command: PrescribedTextFieldObservables<ApiCalls.Command>;
  seed: PrescribedTextFieldObservables<string>;
  respondTo: PrescribedTextFieldObservables<string>;

  derivationOptionsJson: PrescribedTextFieldObservables<string>;
  message: PrescribedTextFieldObservables<string>;
  unsealingInstructions: PrescribedTextFieldObservables<string>;
  packagedSealedMessageJson: PrescribedTextFieldObservables<string>;

  requestId: PrescribedTextFieldObservables<string>;
  requestUrl: PrescribedTextFieldObservables<string>;

  responseUrl = new Observable<string>();

  constructor(options: CommandSimulatorOptions) {
    super (options);
    this.command = new PrescribedTextFieldObservables<ApiCalls.Command>(options.command);
    this.seed = new PrescribedTextFieldObservables(options.seed);
    this.respondTo = new PrescribedTextFieldObservables(options.respondTo);

    this.derivationOptionsJson = new PrescribedTextFieldObservables(options.derivationOptionsJson);
    this.message = new PrescribedTextFieldObservables(options.message);
    this.unsealingInstructions = new PrescribedTextFieldObservables(options.unsealingInstructions);
    this.packagedSealedMessageJson = new PrescribedTextFieldObservables(options.packagedSealedMessageJson);

    this.requestId = new PrescribedTextFieldObservables(options.requestId);
    this.requestUrl = new PrescribedTextFieldObservables(options.requestUrl);
  }

  processRequestUrl = async (
    requestUrlString: string
  ) => {
    const requestUrl = new URL(requestUrlString);
    const {searchParams} = requestUrl;
    const command = searchParams.get(ApiCalls.RequestCommandParameterNames.command) as ApiCalls.Command | null;
    if (command == null || !(command in ApiCalls.Command)) {
      return;
    }
    const request = getApiRequestFromSearchParams(requestUrl.searchParams);
    const respondTo = searchParams.get(UrlRequestMetadataParameterNames.respondTo);
    
    const seedString = this.seed.value;
    if (seedString && request && respondTo) {
      const response = await CommandSimulator.computeApiCommandWorker.calculate({seedString, request});
      const responseUrl = addResponseToUrl(command, respondTo, response);
      this.responseUrl.set(responseUrl);
    }
  }


  get requiresDerivationOptionsJson(): boolean {
    const command = this.command.value;
    return !!command &&
      DerivationFunctionParameterNames.derivationOptionsJson in ParameterNames[command];
  }

  get requiresMessage(): boolean { return this.command.value === ApiCalls.Command.sealWithSymmetricKey };
  get requiresPackagedSealedMessage(): boolean {
    return this.command.value === ApiCalls.Command.unsealWithUnsealingKey ||
           this.command.value === ApiCalls.Command.unsealWithSymmetricKey;
  }
  get requiresClientMayRetrieveKey(): boolean {
    return !!this.command.value && commandRequiresDerivationOptionOfClientMayRetrieveKey(this.command.value);
  }

  render() {

    const command = this.command.value;

    if (command && DerivationFunctionParameterNames.derivationOptionsJson in ParameterNames[command]) {
      this.append(
        new PrescribedTextInput({...this.derivationOptionsJson})
      )
    }
    
  }

}