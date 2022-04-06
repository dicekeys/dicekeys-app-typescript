import styled from "styled-components";
import { HeightBetweenTopNavigationBarAndStandardBottomBar, StandardWidthBetweenSideMargins } from "../../../views/Navigation/NavigationLayout";
import { cssCalcTyped, cssExprWithoutCalc } from "../../../utilities";

export const ContentWidth = StandardWidthBetweenSideMargins;
export const DiceKeyMaxWidth = cssExprWithoutCalc(`${ContentWidth} * 0.3`);

export const MaxContentViewHeight = HeightBetweenTopNavigationBarAndStandardBottomBar;
export const DownArrowAndPlusSignViewHeightInVh = 4;
export const KeyPlusRecipeViewMaxHeightInVh = 30;
export const WizardOrFieldsMaxHeightInVh = 24;
export const WizardMinHeightInVh = 14;
export const MinimumVerticalMarginAtTopBottomNavBarsVh = 2;
export const DerivedValueBoxMaxHeight = cssExprWithoutCalc(`${MaxContentViewHeight} - ${(
  KeyPlusRecipeViewMaxHeightInVh +
  DownArrowAndPlusSignViewHeightInVh +
  WizardOrFieldsMaxHeightInVh +
  2 * MinimumVerticalMarginAtTopBottomNavBarsVh
)}vh`);
export const CalcDerivedValueBoxMaxHeight = cssCalcTyped(DerivedValueBoxMaxHeight);
export const DiceKeyBoxMaxHeight = `${KeyPlusRecipeViewMaxHeightInVh}vh` as const;

export const DiceKeyBoxMaxWidth = DiceKeyMaxWidth;
export const DiceKeyBoxSize = cssExprWithoutCalc(`min(${DiceKeyBoxMaxWidth}, ${DiceKeyBoxMaxHeight})`);

export const DerivationViewSection = styled.div`
  display: flex;
  flex-direction: column;  
  justify-content: center;
  width: ${ContentWidth};
`;

export const DerivationViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-self: center;
  height: ${HeightBetweenTopNavigationBarAndStandardBottomBar};
`;

export const RecipeWizardOrFieldsContainer = styled(DerivationViewSection)`
  align-content: flex-start;
  height: ${WizardOrFieldsMaxHeightInVh}vh;
`;

export const DerivedContentContainer = styled(DerivationViewSection)`
  justify-content: flex-start;
  height: ${CalcDerivedValueBoxMaxHeight};
`;

export const KeyPlusRecipeColumn = styled(DerivationViewSection)`
  align-items: flex-start;
`;