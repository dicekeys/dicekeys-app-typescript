import { HeightBelowTopNavigationBar, ModalOverlayOfWindowBelowTopLevelNavigationBar, TopNavigationBarHeightInVh } from "../../views/Navigation/TopNavigationBar";
import styled from "styled-components";
import { cssCalcTyped, cssCalcInputExpr } from "../../utilities";

const RecommendedSideMarginAsVw = 5;
export const WidthBetweenSideMarginsAsVw = 100 - 2 * RecommendedSideMarginAsVw;

export const BottomIconBarHeightInVh = 11;
export const BottomIconBarHeight = `${BottomIconBarHeightInVh}vh` as const;


export const HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh = 100 - (
  TopNavigationBarHeightInVh + BottomIconBarHeightInVh
);

export const SelectedDiceKeyContentRegionWithoutSideMargins = styled.div`
  height: ${HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh}vh;
  width: 100vw;
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  flex: 0 0 auto;
`;

export const SelectedDiceKeyContentRegionInsideSideMargins = styled(SelectedDiceKeyContentRegionWithoutSideMargins)`
  padding-left: ${RecommendedSideMarginAsVw}vw;
  padding-right: ${RecommendedSideMarginAsVw}vw;
  width: calc(100vw - (2 * (${RecommendedSideMarginAsVw}vw)));
`;


export const HeightBetweenTopAndBottomBars = cssCalcTyped(`${cssCalcInputExpr(HeightBelowTopNavigationBar)} - ${cssCalcInputExpr(BottomIconBarHeight)}`)
export const ModalOverlayBetweenTopNavigationBarAndBottomIconBar = styled(ModalOverlayOfWindowBelowTopLevelNavigationBar)`
  height: ${HeightBetweenTopAndBottomBars};
`;

export const ModalOverlayForDialogOrMessage = styled(ModalOverlayBetweenTopNavigationBarAndBottomIconBar)`
  width: 80vw;
  padding-left: 10vw;
  padding-right: 10vw;
`;

export const ModalOverlayForWarningDialog = styled(ModalOverlayForDialogOrMessage)`
  background-color: yellow;
`;