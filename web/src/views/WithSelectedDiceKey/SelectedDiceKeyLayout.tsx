import {
  BottomIconBarHeightInVh,
} from "./SelectedDiceKeyBottomIconBarView";
import { TopNavigationBarHeightInVh } from "../../views/Navigation/TopNavigationBar";
import styled from "styled-components";

export const ScreenWidthPercentUsed = 85;
export const SideMarginInVw = (100 - ScreenWidthPercentUsed) / 2;

export const HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh = 100 - (
  TopNavigationBarHeightInVh + BottomIconBarHeightInVh
);

export const SelectedDiceKeyContentRegionWitoutSideMargins = styled.div`
  height: ${HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh}vh;
  width: 100vw;
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  flex: 0 0 auto;
`;

export const SelectedDiceKeyContentRegionInsideSideMargins = styled(SelectedDiceKeyContentRegionWitoutSideMargins)`
  padding-left: ${SideMarginInVw}vw;
  padding-right: ${SideMarginInVw}vw;
`;
