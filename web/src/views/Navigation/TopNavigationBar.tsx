import styled from "styled-components";
import { cssCalcTyped, cssCalcInputExpr } from "../../utilities";

export const TopNavigationBarHeightInVh = 7;
export const TopNavigationBarHeight = `${TopNavigationBarHeightInVh}vh` as const;

const TopLevelNavigationBarFontSize = cssCalcTyped(`min(${`3.75vh`},${`8.5vw`})`);

const ZIndexForModalOverlays = 128;

// export const NavBarBackgroundColor = "#5576C5";

export const NavigationBar = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: row;
  flex: 0 0 auto;
  text-align: center;
  font-size: ${TopLevelNavigationBarFontSize};
  overflow: hidden;
`;

export const TopNavigationBar = styled(NavigationBar)`
  height: ${TopNavigationBarHeight};
  align-items: center;
  background-color: ${ props => props.theme.colors.navigationBar };
  color: ${ props => props.theme.colors.navigationBarForeground };
`;

export const HeightBelowTopNavigationBar = cssCalcTyped(`100vh - ${cssCalcInputExpr(TopNavigationBarHeight)}`)
export const BelowTopNavigationBarWithNoBottomBar = styled.div`
  height: ${HeightBelowTopNavigationBar};
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ModalOverlayOfWindowBelowTopLevelNavigationBar = styled(BelowTopNavigationBarWithNoBottomBar)`
  display: flex;
  position: absolute;
  z-index: ${ZIndexForModalOverlays};
  left: 0;
  top: ${TopNavigationBarHeight};
  background-color: ${ props => props.theme.colors.background };
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const BelowTopNavigationBarWithSideMarginsButNoBottomBar = styled(BelowTopNavigationBarWithNoBottomBar)`
  margin-left: 5vw;
  margin-right: 5vw;
  width: 90vw;
  justify-content: space-around;
`

const TopNavRegion = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  user-select: none;
  font-size: ${TopLevelNavigationBarFontSize};
  overflow: hidden;
`;

const TopEdgeNavRegion = styled(TopNavRegion)`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 12.5vw;
  padding-left: 1rem;
  padding-right: 1rem;
`;

export const TopNavLeftSide = styled(TopEdgeNavRegion)`
  cursor: pointer;
  justify-content: flex-start;
`;

export const TopNavCenter = styled(TopNavRegion)`
  width: 85vw;
`;

export const TopNavRightSide = styled(TopEdgeNavRegion)`
  justify-content: end;
`;

export const TopNavPopUpMenu = styled.div<{isOpen: boolean}>`
  display: flex;
  position: absolute;
  top: ${TopNavigationBarHeightInVh}vh;
  flex-direction: column;
  align-items: flex-start;
  min-width: 10%;
  width: fit-content;
  /* padding-left: 1rem;
  padding-right: 1rem; */
  background-color: ${ props => props.theme.colors.navigationBar };
  ${ ({isOpen}) => isOpen ? `` : `visibility: hidden` }
`;

export const Clickable = styled.span`
  cursor: grab;
  :hover {
    color: ${ props => props.theme.colors.background}
  }
`;

export const TopNavRightPopUpMenu = styled(TopNavPopUpMenu)`
  right: 0;
  z-index: 255;
`;
