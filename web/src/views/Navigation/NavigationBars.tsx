import styled from "styled-components";

export const TopNavigationBarHeightInVh = 7;


export const BottomNavigationBarHeightInVh = 11;
export const BetweenTopAndBottomNavigationBarsHeightInVh = 100 - (
  TopNavigationBarHeightInVh + BottomNavigationBarHeightInVh
);

const TopBottomNavigationBase = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: row;
  flex: 0 0 auto;
  text-align: center;
  font-size: 3.75vh;
`;

export const TopNavigationBar = styled(TopBottomNavigationBase)`
  height: ${TopNavigationBarHeightInVh}vh;
  align-items: center;
  background-color: #5576C5;
`;

export const BottomNavigationBar = styled(TopBottomNavigationBase)`
  height: ${BottomNavigationBarHeightInVh}vh;
  background-color: gray;
  align-items: baseline;
`;

export const BelowTopNavigationBarWithNoBottomBar = styled.div`
  height: ${100-TopNavigationBarHeightInVh}vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
`;

export const BetweenTopAndBottomNavigationBars = styled.div`
  height: ${BetweenTopAndBottomNavigationBarsHeightInVh}vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  flex-direction: column;
  flex: 0 0 auto;
`;

const TopNavRegion = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
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

export const FooterButtonDiv = styled.div<{selected: boolean}>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 25vw;
  padding-right: 0;
  padding-left: 0;
  margin-top: 1vh;
  margin-bottom: 1vh;
  cursor: pointer;
  filter: ${(props) => props.selected ? `invert(100%)` : `none` };
  &:hover {
    filter: invert(75%);
  }
`;

export const FooterIconImg = styled.img`
  display: flex;
  max-height: 5vh;
  flex-basis: 0;
  flex-grow: 1;
`;