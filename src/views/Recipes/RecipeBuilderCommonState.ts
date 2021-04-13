import { DerivationRecipeType } from "../../dicekeys/DerivationRecipe";

export interface RecipeBuilderCommonState {
  type: DerivationRecipeType;
  error?: Error;
  recipe?: string;
  name: string;
}