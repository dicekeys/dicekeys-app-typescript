import {
  BottomIconBarHeightInVh,
} from "./SelectedDiceKeyBottomIconBarView";
import { TopNavigationBarHeightInVh } from "../../views/Navigation/TopNavigationBar";
import styled from "styled-components";

const RecommendedSideMarginAsVw = 5;
export const WidthBetweenSideMarginsAsVw = 100 - 2 * RecommendedSideMarginAsVw;

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
