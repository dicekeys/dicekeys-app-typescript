import {
  ScreenWidthPercentUsed,
  HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh
} from "../../../views/WithSelectedDiceKey/SelectedDiceKeyLayout";

export const DiceKeyMaxWidthPercent = 22.5;

export const BoxPadding = `0.35rem`;

export const ContentWidthInVw = ScreenWidthPercentUsed;

export const MaxContentViewHeight = HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh;
export const DownArrowAndPlusSignViewHeight = 4;
export const LabelFontSizeVh = 3;
export const KeyPlusRecipeViewMaxHeight = 28;
export const WizardOrFieldsMaxHeight = 24;
export const WizardMinHeightInVh = 14;
export const DerivedValueBoxMaxHeight = MaxContentViewHeight - (KeyPlusRecipeViewMaxHeight + DownArrowAndPlusSignViewHeight + WizardOrFieldsMaxHeight);
export const diceKeyBoxMaxHeight = `${KeyPlusRecipeViewMaxHeight}vh`;

export const DiceKeyBoxMaxWidth = `${DiceKeyMaxWidthPercent}vw`;
export const DiceKeyBoxSize = `min(${DiceKeyBoxMaxWidth}, ${diceKeyBoxMaxHeight})`;
export const PlusSignWidthPercent = 5;
export const PlusSignViewWidth = `${PlusSignWidthPercent}vw`;
export const recipeViewWidthPercent = ScreenWidthPercentUsed - (DiceKeyMaxWidthPercent + PlusSignWidthPercent);
export const spaceToLeftOfRecipeViewFormula = `(${DiceKeyBoxSize} + ${PlusSignWidthPercent}vw + (1  * (${BoxPadding}))))`;
export const spaceToLeftOfRecipeViewCalculated = `calc(${spaceToLeftOfRecipeViewFormula})`;
export const recipeViewWidthFormula = `(${ScreenWidthPercentUsed}vw - (${DiceKeyBoxSize} + ${PlusSignWidthPercent}vw + (2  * (${BoxPadding}))))`;
export const recipeViewWidthCalculated= `calc(${recipeViewWidthFormula})`;
