import {
  SeededCryptoModuleWithHelpers, SeededCryptoModulePromise
} from "@dicekeys/seeded-crypto-js";
import * as ApiCommands from "./api-commands"
import {
  ApiCalls,
  Exceptions,
} from "@dicekeys/dicekeys-api-js";


/**
 * Implements the server-side API calls
 *
 * Internally, this class does not have access to the user's raw seeds (DiceKeys).
 * Rather, the commands are to be seeded only after permission checks are complete.
 *
 * The caller is responsible for catching exceptions
 */
export class SeededApiCommands {
  constructor(
    private seededCryptoModule: SeededCryptoModuleWithHelpers,
    seedString: string,
  ) {
    this.#seedString = seedString;
  }

  /**
   * Use ECMAScript-enforced private fields for the seedString and the
   * implementApiCall function that accesses the seedString so that
   * hose with access to this object can't extract the seedString.
   * */  
  readonly #seedString: string;

  static async create(seedString: string) {
    return new SeededApiCommands(await SeededCryptoModulePromise, seedString);
  }

  public get generateSignature() { return ApiCommands.generateSignature(this.seededCryptoModule)(this.#seedString); }
  public get getSealingKey() { return ApiCommands.getSealingKey(this.seededCryptoModule)(this.#seedString); }
  public get getUnsealingKey() { return ApiCommands.getUnsealingKey(this.seededCryptoModule)(this.#seedString); }
  public get getSecret() { return ApiCommands.getSecret(this.seededCryptoModule)(this.#seedString); }
  public get getSignatureVerificationKey() { return ApiCommands.getSignatureVerificationKey(this.seededCryptoModule)(this.#seedString); }
  public get getSigningKey() { return ApiCommands.getSigningKey(this.seededCryptoModule)(this.#seedString); }
  public get getSymmetricKey() { return ApiCommands.getSymmetricKey(this.seededCryptoModule)(this.#seedString); }
  public get getPassword() { return ApiCommands.getPassword(this.seededCryptoModule)(this.#seedString); }
  public get sealWithSymmetricKey() { return ApiCommands.sealWithSymmetricKey(this.seededCryptoModule)(this.#seedString); }
  public get unsealWithSymmetricKey() { return ApiCommands.unsealWithSymmetricKey(this.seededCryptoModule)(this.#seedString); }
  public get unsealWithUnsealingKey() { return ApiCommands.unsealWithUnsealingKey(this.seededCryptoModule)(this.#seedString); }

  executeRequest = <REQUEST extends ApiCalls.ApiRequestObject>(
    request: REQUEST & ApiCalls.ApiRequestObject
  ): ApiCalls.ResultForRequest<REQUEST> => {
    switch (request.command) {
      case ApiCalls.Command.generateSignature:
        return this.generateSignature(request);
      case ApiCalls.Command.getPassword:
        return this.getPassword(request);
      case ApiCalls.Command.getSealingKey:
        return this.getSealingKey(request);
      case ApiCalls.Command.getSecret:
        return this.getSecret(request);
      case ApiCalls.Command.getSignatureVerificationKey:
        return this.getSignatureVerificationKey(request);
      case ApiCalls.Command.getSigningKey:
        return this.getSigningKey(request);
      case ApiCalls.Command.getSymmetricKey:
        return this.getSymmetricKey(request);
      case ApiCalls.Command.getUnsealingKey:
        return this.getUnsealingKey(request);
      case ApiCalls.Command.sealWithSymmetricKey:
        return this.sealWithSymmetricKey(request);
      case ApiCalls.Command.unsealWithSymmetricKey:
        return this.unsealWithSymmetricKey(request);
      case ApiCalls.Command.unsealWithUnsealingKey:
        return this.unsealWithUnsealingKey(request);
      default: 
        throw new Exceptions.InvalidCommand();
    }
  }
}
