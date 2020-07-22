import {
  SeededApiCommands
} from "./seeded-api-commands"
import {
  SeededCryptoModuleWithHelpers
} from "@dicekeys/seeded-crypto-js";
import {
  ApiCalls,
} from "@dicekeys/dicekeys-api-js";


export class SeededApiRequest<REQUEST extends ApiCalls.ApiRequestObject> {
  readonly #seededApiCommands: SeededApiCommands;
  constructor(
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    seedString: string,
    public readonly request: REQUEST & ApiCalls.ApiRequestObject
  ) {
    this.#seededApiCommands = new SeededApiCommands(seededCryptoModule, seedString);
  }

  public execute = (): ApiCalls.ResultForRequest<REQUEST> =>
    this.#seededApiCommands.executeRequest(this.request);

}
