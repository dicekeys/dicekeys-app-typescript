import {
  SeededApiCommands
} from "./seeded-api-commands"
import {
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  ApiCalls
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfClientMayNotRetrieveKey
} from "./permission-checks";

export class PermissionCheckedSeededApiCommand {
  readonly #seededApiCommands: SeededApiCommands;
  readonly #throwIfClientNotPermitted: (request: ApiCalls.ApiRequestObject) => void;

  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    throwIfClientNotPermitted: (request: ApiCalls.ApiRequestObject) => void,
    seedString: string,
  ) {
    this.#seededApiCommands = new SeededApiCommands(seededCryptoModule, seedString);
    this.#throwIfClientNotPermitted = throwIfClientNotPermitted;
  }

  public executeRequest = <REQUEST extends ApiCalls.ApiRequestObject>(
    request: REQUEST & ApiCalls.ApiRequestObject
  ) => {
    // Validate that client is permitted
    this.#throwIfClientNotPermitted(request);
    throwIfClientMayNotRetrieveKey(request);
    return this.#seededApiCommands.executeRequest(request);
  }
}

export class PermissionCheckedSeededApiRequest<REQUEST extends ApiCalls.ApiRequestObject> {
  readonly #permissionCheckedSeededApiCommands: PermissionCheckedSeededApiCommand;
  readonly #request: REQUEST & ApiCalls.ApiRequestObject;
  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    throwIfClientNotPermitted: (request: ApiCalls.ApiRequestObject) => void,
    seedString: string,
    request: REQUEST & ApiCalls.ApiRequestObject
  ) {
    this.#permissionCheckedSeededApiCommands = new PermissionCheckedSeededApiCommand(
      seededCryptoModule,
      throwIfClientNotPermitted,
      seedString
    );
    this.#request = request;
  }

  /**
   * To ensure the internal representation of the request cannot be modified
   * to prevent permission checks or to change the request between permission
   * checking and execution, always return a copy and not the value of record.
   */
  public get request(): REQUEST {
    return {...this.#request};
  }

  public execute = () => {
    return this.#permissionCheckedSeededApiCommands.executeRequest(this.request);
  }
}

