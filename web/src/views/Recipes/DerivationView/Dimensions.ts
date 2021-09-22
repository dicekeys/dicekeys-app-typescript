
export const DiceKeyMaxWidthPercent = 22.5;

export const BoxPadding = `0.35rem`

// Content can use 80% of height
export const MaxContentViewHeight = 80;
export const DownArrowAndPlusSignViewHeight = 4;
export const LabelFontSizeVh = 3;
export const KeyPlusRecipeViewMaxHeight = 28;
export const WizardOrFieldsMaxHeight = 28;
export const DerivedValueBoxMaxHeight = MaxContentViewHeight - (KeyPlusRecipeViewMaxHeight + DownArrowAndPlusSignViewHeight + WizardOrFieldsMaxHeight);
export const diceKeyBoxMaxHeight = `${KeyPlusRecipeViewMaxHeight}vh`;

export const ScreenWidthPercentUsed = 85;
export const DiceKeyBoxMaxWidth = `${DiceKeyMaxWidthPercent}vw`;
export const DiceKeyBoxSize = `min(${DiceKeyBoxMaxWidth}, ${diceKeyBoxMaxHeight})`;
export const PlusSignWidthPercent = 5;
export const PlusSignViewWidth = `${PlusSignWidthPercent}vw`;
export const recipeViewWidthPercent = ScreenWidthPercentUsed - (DiceKeyMaxWidthPercent + PlusSignWidthPercent);
export const recipeViewWidth = `calc(${ScreenWidthPercentUsed}vw - (${DiceKeyBoxSize} + ${PlusSignWidthPercent}vw + (2  * (${BoxPadding}))))`;
