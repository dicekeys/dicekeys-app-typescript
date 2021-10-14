import {
  ScreenWidthPercentUsed,
  HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh
} from "../../../views/WithSelectedDiceKey/SelectedDiceKeyLayout";


export const BoxPadding = `0.35rem`;

export const ContentWidthInVw = ScreenWidthPercentUsed;
export const DiceKeyMaxWidthPercent = (ScreenWidthPercentUsed * 0.3);

export const MaxContentViewHeight = HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh;
export const DownArrowAndPlusSignViewHeight = 4;
export const LabelFontSizeVh = 3;
export const KeyPlusRecipeViewMaxHeight = 35;
export const WizardOrFieldsMaxHeight = 24;
export const WizardMinHeightInVh = 14;
export const MinimumVerticalMarginAtTopBottomNavBarsVh = 1;
export const DerivedValueBoxMaxHeight = MaxContentViewHeight - (
  KeyPlusRecipeViewMaxHeight +
  DownArrowAndPlusSignViewHeight +
  WizardOrFieldsMaxHeight +
  2 * MinimumVerticalMarginAtTopBottomNavBarsVh
);
export const DiceKeyBoxMaxHeight = `${KeyPlusRecipeViewMaxHeight}vh` as const;

export const DiceKeyBoxMaxWidth = `${DiceKeyMaxWidthPercent}vw` as const;
export const DiceKeyBoxSize = `min(${DiceKeyBoxMaxWidth}, ${DiceKeyBoxMaxHeight})` as const;
export const PlusSignWidthPercent = 5;
export const PlusSignViewWidth = `${PlusSignWidthPercent}vw` as const;
export const recipeViewWidthPercent = ScreenWidthPercentUsed - (DiceKeyMaxWidthPercent + PlusSignWidthPercent);
export const spaceToLeftOfRecipeViewFormula = `(${DiceKeyBoxSize} + ${PlusSignWidthPercent}vw + (1  * (${BoxPadding}))))`;
export const spaceToLeftOfRecipeViewCalculated = `calc(${spaceToLeftOfRecipeViewFormula})`;
export const recipeViewWidthFormula = `(${ScreenWidthPercentUsed}vw - (${DiceKeyBoxSize} + ${PlusSignWidthPercent}vw + (2  * (${BoxPadding}))))` as const;
export const recipeViewWidthCalculated= `calc(${recipeViewWidthFormula})`;
