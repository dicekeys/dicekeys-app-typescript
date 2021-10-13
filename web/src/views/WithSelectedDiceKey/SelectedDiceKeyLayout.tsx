import {
  BottomIconBarHeightInVh,
} from "./SelectedDiceKeyBottomIconBarView";
import { TopNavigationBarHeightInVh } from "../../views/Navigation/TopNavigationBar";
import styled from "styled-components";

export const HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh = 100 - (
  TopNavigationBarHeightInVh + BottomIconBarHeightInVh
);

export const BetweenTopNavigationBarAndBottomIconBar = styled.div`
  height: ${HeightOfContentRegionBetweenTopAndBottomNavigationBarsInVh}vh;
  width: 100vw;
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  flex: 0 0 auto;
`;
