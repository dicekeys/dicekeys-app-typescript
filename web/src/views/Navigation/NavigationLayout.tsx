import { DivSupportingInvisible } from "../../css";
import styled, {css} from "styled-components";
import { cssCalcTyped, cssExprWithoutCalc } from "../../utilities";

export const StandardSideMargin = `5vw`;
export const StandardWidthBetweenSideMargins = cssExprWithoutCalc(`100vw - 2 * ${StandardSideMargin}`);
export const TopNavigationBarHeight = `7vh`;

export const HeightBelowTopNavigationBar = `(100vh - ${cssExprWithoutCalc(TopNavigationBarHeight)})` as const;
export const calcHeightBelowTopNavigationBar = cssCalcTyped(HeightBelowTopNavigationBar);

export const StandardBottomBarHeight = `11vh`;

export const TopLevelNavigationBarFontSize = cssExprWithoutCalc(`min(${`3.75vh`},${`8.5vw`})`);

export const HeightBetweenTopNavigationBarAndStandardBottomBar = cssExprWithoutCalc(`100vh - (${TopNavigationBarHeight} + ${StandardBottomBarHeight})`)
export const CalcHeightBetweenTopNavigationBarAndStandardBottomBar = cssCalcTyped(HeightBetweenTopNavigationBarAndStandardBottomBar);

const ZIndexForModalOverlays = 128;

export const WindowRegionColumnContainer= styled(DivSupportingInvisible)`
  @media screen {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    overflow: hidden;    
  }
`;

export const WindowRegionBelowTopNavigationBar = styled(WindowRegionColumnContainer)`
  @media screen {
    height: ${calcHeightBelowTopNavigationBar};
  }
`;

export const WindowRegionBelowTopNavigationBarAndAboveStandardBottomBar = styled(WindowRegionColumnContainer)`
  @media screen {
    height: ${CalcHeightBetweenTopNavigationBarAndStandardBottomBar};    
  }
`;

const ImposeStandardSideMargins = css`
  @media screen {
    margin-left: ${cssCalcTyped(StandardSideMargin)};
    margin-right: ${cssCalcTyped(StandardSideMargin)};
    width: ${cssCalcTyped(StandardWidthBetweenSideMargins)};
  }
  @media print {
    margin: 0;
	}

`

export const WindowRegionBelowTopNavigationBarWithSideMargins = styled(WindowRegionBelowTopNavigationBar)`
  ${ImposeStandardSideMargins}
`

export const WindowRegionBelowTopNavigationBarAndAboveStandardBottomBarWithMargins = styled(WindowRegionBelowTopNavigationBarAndAboveStandardBottomBar)`
  ${ImposeStandardSideMargins}
`




export const ModalOverlayOfWindowBelowTopLevelNavigationBar = styled(WindowRegionBelowTopNavigationBar)`
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


export const ModalOverlayBetweenTopNavigationBarAndBottomIconBar = styled(ModalOverlayOfWindowBelowTopLevelNavigationBar)`
  height: ${CalcHeightBetweenTopNavigationBarAndStandardBottomBar}
`;

export const ModalOverlayForDialogOrMessage = styled(ModalOverlayBetweenTopNavigationBarAndBottomIconBar)`
  width: 80vw;
  padding-left: 10vw;
  padding-right: 10vw;
`;

export const ModalOverlayForWarningDialog = styled(ModalOverlayForDialogOrMessage)`
  background-color: yellow;
`;

export const NavigationBar = styled.div`
  @media screen {
    overflow: hidden;    
    width: 100vw;
    display: flex;
    flex-direction: row;
    flex: 0 0 auto;
    text-align: center;
    font-size: calc(${TopLevelNavigationBarFontSize});
  }
  @media print {
		display: none;
	}
`;

export const TopNavigationBar = styled(NavigationBar)`
  height: ${TopNavigationBarHeight};
  align-items: center;
  background-color: ${ props => props.theme.colors.navigationBar };
  color: ${ props => props.theme.colors.navigationBarForeground };
`;

const TopNavRegion = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  user-select: none;
  font-size: calc(${TopLevelNavigationBarFontSize});
  @media screen {
    overflow: hidden;    
  }
  @media print {
		display: none;
	}
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

export const TopNavPopUpMenu = styled.div<{$isOpen: boolean}>`
  display: flex;
  position: absolute;
  top: ${TopNavigationBarHeight};
  flex-direction: column;
  align-items: flex-start;
  min-width: 10%;
  width: fit-content;
  /* padding-left: 1rem;
  padding-right: 1rem; */
  background-color: ${ props => props.theme.colors.navigationBar };
  ${ ({$isOpen: isOpen}) => isOpen ? `` : `visibility: hidden` }
`;

export const Clickable = styled.span`
  cursor: grab;
  &:hover {
    color: ${ props => props.theme.colors.background};
  }
  @media print {
    display: none;
  }
`;

export const TopNavRightPopUpMenu = styled(TopNavPopUpMenu)`
  right: 0;
  z-index: 255;
`;
