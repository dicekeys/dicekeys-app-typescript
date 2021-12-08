import { StandardBottomBarHeight, WindowRegionBelowTopNavigationBarAndAboveStandardBottomBar, WindowRegionBelowTopNavigationBarAndAboveStandardBottomBarWithMargins } from "../Navigation/NavigationLayout";
import styled from "styled-components";

export const BottomIconBarHeight = StandardBottomBarHeight;

export const SelectedDiceKeyContentRegionWithoutSideMargins = styled(WindowRegionBelowTopNavigationBarAndAboveStandardBottomBar)`
  flex: 0 0 auto;
`;

export const SelectedDiceKeyContentRegionInsideSideMargins = styled(WindowRegionBelowTopNavigationBarAndAboveStandardBottomBarWithMargins)`
`;
