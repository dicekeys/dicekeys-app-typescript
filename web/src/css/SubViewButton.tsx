
import styled from "styled-components";

export const SubViewButton = styled.button`
  display: flex;
  cursor: grab;
  flex-direction: column;
  align-items: center;
  border: none;
  padding: 0.5rem;
  margin: 0.5rem;
  border-radius: 0.5rem;
  &:hover {
    background-color: rgba(128,128,128,.75);
  }
`;

export const SubViewButtonImage = styled.img`
  height: 14vh;
`;

export const SubViewButtonCaption = styled.div`
  font-size: min(1.5rem,3.5vh,2.5vw);
  margin-top: min(0.75rem, 0.5vh);
`;
