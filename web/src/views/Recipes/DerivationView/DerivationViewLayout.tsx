import styled from "styled-components";
import {
  WidthBetweenSideMarginsAsVw,
  HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh,
  SelectedDiceKeyContentRegionInsideSideMargins
} from "../../WithSelectedDiceKey/SelectedDiceKeyLayout";

export const ContentWidthInVw = WidthBetweenSideMarginsAsVw;
export const DiceKeyMaxWidthPercent = (WidthBetweenSideMarginsAsVw * 0.3);

export const MaxContentViewHeight = HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh;
export const DownArrowAndPlusSignViewHeight = 4;
export const KeyPlusRecipeViewMaxHeight = 30;
export const WizardOrFieldsMaxHeight = 24;
export const WizardMinHeightInVh = 14;
export const MinimumVerticalMarginAtTopBottomNavBarsVh = 2;
export const DerivedValueBoxMaxHeight = MaxContentViewHeight - (
  KeyPlusRecipeViewMaxHeight +
  DownArrowAndPlusSignViewHeight +
  WizardOrFieldsMaxHeight +
  2 * MinimumVerticalMarginAtTopBottomNavBarsVh
);
export const DiceKeyBoxMaxHeight = `${KeyPlusRecipeViewMaxHeight}vh` as const;

export const DiceKeyBoxMaxWidth = `${DiceKeyMaxWidthPercent}vw` as const;
export const DiceKeyBoxSize = `min(${DiceKeyBoxMaxWidth}, ${DiceKeyBoxMaxHeight})` as const;

export const DerivationViewSection = styled.div`
  display: flex;
  flex-direction: column;  
  justify-content: center;
  width: ${ContentWidthInVw}vw;
`;

export const DerivationViewContainer = styled(SelectedDiceKeyContentRegionInsideSideMargins)`
  align-items: center;
  justify-self: center;
  height: ${HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh}vh;
`;

export const RecipeWizardOrFieldsContainer = styled(DerivationViewSection)`
  align-content: flex-start;
  height: ${WizardOrFieldsMaxHeight}vh;
`;

export const DerivedContentContainer = styled(DerivationViewSection)`
  justify-content: flex-start;
  height: ${DerivedValueBoxMaxHeight}vh;
`;

export const KeyPlusRecipeColumn = styled(DerivationViewSection)`
  align-items: flex-start;
`;