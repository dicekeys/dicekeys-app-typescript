import React from "react";
import { action, makeAutoObservable } from "mobx";
import { observer  } from "mobx-react";
import { addSequenceNumberToRecipeJson, DerivationRecipe, DerivationRecipeType } from "../../dicekeys/derivation-recipe";
import { SequenceNumberFormFieldView, SequenceNumberState} from "./recipe-builder-sequence-number";
import { RecipeBuilderCommonState } from "./recipe-builder-common-state";

export class RecipeBuilderForTemplateState implements RecipeBuilderCommonState, SequenceNumberState {
  template: DerivationRecipe;
  sequenceNumber: number | undefined;
  setSequenceNumber = action( (newSequenceNumber?: number) => {
    this.sequenceNumber = newSequenceNumber;
  });

  get type(): DerivationRecipeType {
    return this.template.type;
  }

  get recipe(): string {
    return addSequenceNumberToRecipeJson(this.template.recipeJson, this.sequenceNumber);
  }

  get name(): string {
    return this.template.name + (
      this.sequenceNumber == 1 ? `` : ` (${this.sequenceNumber})`
    )
  }

  constructor(template: DerivationRecipe, sequenceNumber: number = 1) {
    this.template = template;
    this.sequenceNumber = sequenceNumber;
    makeAutoObservable(this);
  }
}

export const RecipeBuilderForTemplateView = observer( ( props: {state: RecipeBuilderForTemplateState}) => (
  <SequenceNumberFormFieldView sequenceNumberState={props.state} />
));
