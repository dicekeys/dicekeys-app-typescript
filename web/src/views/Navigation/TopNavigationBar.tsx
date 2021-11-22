import styled from "styled-components";

export const TopNavigationBarHeightInVh = 7;

// export const NavBarBackgroundColor = "#5576C5";

export const NavigationBar = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: row;
  flex: 0 0 auto;
  text-align: center;
  font-size: 3.75vh;
  overflow: hidden;
`;

export const TopNavigationBar = styled(NavigationBar)`
  height: ${TopNavigationBarHeightInVh}vh;
  align-items: center;
  background-color: ${ props => props.theme.colors.navigationBar };
  color: ${ props => props.theme.colors.navigationBarForeground };
`;

export const BelowTopNavigationBarWithNoBottomBar = styled.div`
  height: ${100-TopNavigationBarHeightInVh}vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  font-size: 3.75vh;
  overflow: hidden;
`;

const TopEdgeNavRegion = styled(TopNavRegion)`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 10%;
  max-width: 12.5%;
  flex-basis: 12.5%;
  flex-shrink: 1;
  padding-left: 1rem;
  padding-right: 1rem;
`;

export const TopNavLeftSide = styled(TopEdgeNavRegion)`
  cursor: pointer;
  justify-content: flex-start;
`;

export const TopNavCenter = styled(TopNavRegion)`
  flex-basis: 70%;
  flex-grow: 2;
  flex-shrink: 0;
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
  padding-left: 1rem;
  padding-right: 1rem;
  background-color: ${ props => props.theme.colors.navigationBar };
  ${ ({isOpen}) => isOpen ? `` : `visibility: hidden` }
`;

export const Clickable = styled.span`
  cursor: grab;
  :hover {
    color: ${ props => props.theme.colors.background} // invert(${ (props) => props.theme.colors.foreground });
  }
`;

export const TopNavRightPopUpMenu = styled(TopNavPopUpMenu)`
  right: 0;
  z-index: 255;
`;
