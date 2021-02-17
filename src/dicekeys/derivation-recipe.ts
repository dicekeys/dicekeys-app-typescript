import {DerivableObjectName} from "@dicekeys/dicekeys-api-js"

export type DerivationRecipeType = DerivableObjectName

export class DerivationRecipe {
  constructor(
    public readonly type: DerivationRecipeType,
    public readonly name: string,
    public readonly recipeJson: string
  ) {
  }
}