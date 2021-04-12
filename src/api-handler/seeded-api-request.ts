import {
  SeededApiCommands
} from "./seeded-api-commands"
import {
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  ApiCalls,
} from "@dicekeys/dicekeys-api-js";

/**
 * A container that holds everything needed to calculate the response to an API request:
 *   - the request itself
 *   - the cryptographic secret that seeds all cryptographic operations
 *   - the seeded crypto module (resolved so that operations can be synchronous)
 */
export class SeededApiRequest<REQUEST extends ApiCalls.ApiRequestObject> {
  readonly #seededApiCommands: SeededApiCommands;
  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    seedString: string,
    public readonly request: REQUEST & ApiCalls.ApiRequestObject
  ) {
    this.#seededApiCommands = new SeededApiCommands(seededCryptoModule, seedString);
  }

  /**
   * Calculates the response for an API request.
   * Should be called only from a background worker, except when run within tests.

   * @returns The response matching the API request
   */
  public execute = (): ApiCalls.ResultForRequest<REQUEST> =>
    this.#seededApiCommands.executeRequest(this.request);
}
