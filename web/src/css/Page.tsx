import styled from "styled-components";

export const PrimaryView = styled.div`
  color: ${ props => props.theme.colors.foreground };
  background-color: ${ props => props.theme.colors.background };
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: stretch;
  align-content: stretch;
`;
