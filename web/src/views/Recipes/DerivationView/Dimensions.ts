
export const screenWidthPercentUsed = 90;
export const diceKeyMaxWidthPercent = 22.5;

// Content can use 80% of height
export const MaxContentViewHeight = 80;
export const DownArrowAndPlusSignViewHeight = 4;
export const LabelFontSizeVh = 3;
export const KeyPlusRecipeViewMaxHeight = 28;
export const WizardOrFieldsMaxHeight = 28;
export const DerivedValueBoxMaxHeight = MaxContentViewHeight - (KeyPlusRecipeViewMaxHeight + DownArrowAndPlusSignViewHeight + WizardOrFieldsMaxHeight);
export const diceKeyBoxMaxHeight = `${KeyPlusRecipeViewMaxHeight}vh`;

export const diceKeyBoxMaxWidth = `${diceKeyMaxWidthPercent}vw`;
export const plusSignWidthPercent = 5;
export const plusSignViewWidth = `${plusSignWidthPercent}vw`;
export const recipeViewWidthPercent = screenWidthPercentUsed - (diceKeyMaxWidthPercent + plusSignWidthPercent);
export const recipeViewWidth = `${recipeViewWidthPercent}vw`;
export const diceKeyBoxSize = `min(${diceKeyBoxMaxHeight},${diceKeyBoxMaxWidth})`;

