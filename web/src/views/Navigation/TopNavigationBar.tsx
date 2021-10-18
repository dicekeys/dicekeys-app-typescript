import styled from "styled-components";

export const TopNavigationBarHeightInVh = 7;

export const NavigationBar = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: row;
  flex: 0 0 auto;
  text-align: center;
  font-size: 3.75vh;
`;

export const TopNavigationBar = styled(NavigationBar)`
  height: ${TopNavigationBarHeightInVh}vh;
  align-items: center;
  background-color: #5576C5;
`;

export const BelowTopNavigationBarWithNoBottomBar = styled.div`
  height: ${100-TopNavigationBarHeightInVh}vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
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
