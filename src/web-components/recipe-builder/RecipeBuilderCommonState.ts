import { DerivationRecipeType } from "../../dicekeys/derivation-recipe";

export interface RecipeBuilderCommonState {
  type: DerivationRecipeType;
  error?: Error;
  recipe?: string;
  name: string;
}